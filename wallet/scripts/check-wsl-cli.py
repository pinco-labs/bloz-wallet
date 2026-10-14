"""Offline CLI smoke test; disposable zero-fund wallets, no P2P or mining."""
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request

os.umask(0o077)
binary = Path.home() / '.local/opt/bloz-cli-v1.0.0-rc38/bitcoind'
cli = binary.with_name('bitcoin-cli')
parent = Path.home() / '.local/share/bloz-cli-checks'
parent.mkdir(parents=True, exist_ok=True)
report = {'release': 'v1.0.0-rc38', 'environment': 'WSL Ubuntu-24.04',
          'binarySha256': hashlib.sha256(binary.read_bytes()).hexdigest(),
          'cliVersion': subprocess.check_output([str(cli), '-version'], text=True).strip(),
          'tests': [], 'realFundsUsed': False, 'webWalletMainnetValidated': False}
for chain, port in [('regtest', 19463), ('main', 19464)]:
    data = Path(tempfile.mkdtemp(prefix=chain + '-', dir=parent))
    process = subprocess.Popen([str(binary), f'-chain={chain}', f'-datadir={data}',
        '-nosettings', '-server=1', '-listen=0', '-connect=0', '-dnsseed=0',
        '-discover=0', '-networkactive=0', '-rpcbind=127.0.0.1',
        f'-rpcport={port}', '-printtoconsole=0'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    cookie = data / ('regtest/.cookie' if chain == 'regtest' else '.cookie')
    def rpc(method, params=None, wallet=''):
        auth = base64.b64encode(cookie.read_bytes().strip()).decode()
        request = urllib.request.Request(f'http://127.0.0.1:{port}/' + (f'wallet/{wallet}' if wallet else ''),
            data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or []}).encode(),
            headers={'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=15) as response:
            result = json.load(response)
        if result.get('error'):
            raise RuntimeError(f'{method} failed')
        return result['result']
    ready = False
    try:
        for _ in range(100):
            if process.poll() is not None:
                raise RuntimeError(f'Core exited: inspect {data}/debug.log')
            try:
                info = rpc('getblockchaininfo')
                ready = True
                break
            except (OSError, ValueError):
                time.sleep(.2)
        assert ready, 'startup timeout'
        assert info['chain'] == chain and info['blocks'] == 0
        network = rpc('getnetworkinfo')
        assert not network['networkactive'] and network['connections'] == 0
        rpc('createwallet', ['source-check'])
        address = rpc('getnewaddress', ['CLI offline check', 'bech32'], 'source-check')
        details = rpc('getaddressinfo', [address], 'source-check')
        assert details['iswitness'] and details['witness_version'] == 0
        private = rpc('listdescriptors', [True], 'source-check')
        descriptors = [item['desc'] for item in private['descriptors'] if item['desc'].startswith('wpkh(')]
        assert descriptors
        rpc('createwallet', ['restore-check', False, True])
        imported = rpc('importdescriptors', [[{'desc': desc, 'timestamp': 0, 'range': [0, 10], 'active': False} for desc in descriptors]], 'restore-check')
        assert all(item['success'] for item in imported)
        recovered = rpc('getaddressinfo', [address], 'restore-check')
        assert recovered['ismine'] and recovered['scriptPubKey'] == details['scriptPubKey']
        assert rpc('getbalances', wallet='restore-check')['mine']['trusted'] == 0
        report['tests'].append({'chain': chain, 'blocks': 0, 'p2p': False,
            'segwitAddress': address, 'descriptorRecoveryMatches': True, 'dataDirectory': str(data)})
    finally:
        if ready:
            try:
                rpc('stop')
            except Exception:
                pass
        try:
            process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            process.terminate()
            process.wait(timeout=10)
output = Path(__file__).resolve().parents[1] / 'evidence/wsl-cli-check.json'
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
