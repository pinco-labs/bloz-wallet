"""Receives disposable test descriptors on stdin only. Never connects to P2P."""
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
expected_hash = '60bc037f5b5241da35bf4676aaa94c1fe0314d7d227f9d0f6e602c8101eda01f'
assert hashlib.sha256(binary.read_bytes()).hexdigest() == expected_hash
import sys
fixtures = json.load(sys.stdin)
assert len(fixtures) == 3
parent = Path.home() / '.local/share/bloz-cli-checks'
parent.mkdir(parents=True, exist_ok=True)
data = Path(tempfile.mkdtemp(prefix='web-mainnet-offline-', dir=parent))
port = 19465
process = subprocess.Popen([str(binary), '-chain=main', f'-datadir={data}',
    '-nosettings', '-server=1', '-listen=0', '-connect=0', '-dnsseed=0',
    '-discover=0', '-networkactive=0', '-rpcbind=127.0.0.1',
    f'-rpcport={port}', '-printtoconsole=0'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def rpc(method, params=None, wallet=''):
    auth = base64.b64encode((data / '.cookie').read_bytes().strip()).decode()
    request = urllib.request.Request(f'http://127.0.0.1:{port}/' + (f'wallet/{wallet}' if wallet else ''),
        data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or []}).encode(),
        headers={'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json'})
    # Do not route local RPC through proxy settings.
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=15) as response:
        result = json.load(response)
    if result.get('error'):
        raise RuntimeError(f'{method} failed')
    return result['result']

ready = False
try:
    for _ in range(100):
        if process.poll() is not None:
            raise RuntimeError('Core exited before startup')
        try:
            info = rpc('getblockchaininfo')
            ready = True
            break
        except (OSError, ValueError):
            time.sleep(.2)
    assert ready
    assert info['chain'] == 'main' and info['blocks'] == 0
    assert rpc('getblockhash', [0]) == '44c1a8c852b3eda21966e1ddb6b0807e22488dffe8a270bf24bf1fa2d66c13bd'
    network = rpc('getnetworkinfo')
    assert not network['networkactive'] and network['connections'] == 0
    rpc('createwallet', ['offline-recovery', False, True])
    results = []
    for item in fixtures:
        canonical = rpc('getdescriptorinfo', [item['privateDescriptor']])
        assert canonical['hasprivatekeys'] and not canonical['isrange']
        assert canonical['descriptor'] == item['publicDescriptor']
        assert rpc('deriveaddresses', [canonical['descriptor']]) == [item['address']]
        address = rpc('validateaddress', [item['address']])
        assert address['isvalid'] and address['iswitness'] and address['witness_version'] == 0
        assert not rpc('validateaddress', [item['regtestAddress']])['isvalid']
        imported = rpc('importdescriptors', [[{'desc': item['privateDescriptor'], 'timestamp': 0, 'active': False}]], 'offline-recovery')
        assert imported[0]['success']
        recovered = rpc('getaddressinfo', [item['address']], 'offline-recovery')
        assert recovered['ismine'] and recovered['pubkey'] == item['publicKey']
        assert recovered['scriptPubKey'] == item['scriptPubKey']
        exported = rpc('listdescriptors', [True], 'offline-recovery')
        assert any(entry['desc'] == item['privateDescriptor'] for entry in exported['descriptors'])
        results.append({'address': item['address'], 'scriptPubKey': item['scriptPubKey'],
            'coreDerivationMatches': True, 'corePrivateImportMatches': True,
            'corePrivateRoundTripMatches': True, 'regtestAddressRejected': True})
    rpc('unloadwallet', ['offline-recovery'])
    rpc('loadwallet', ['offline-recovery'])
    assert all(rpc('getaddressinfo', [item['address']], 'offline-recovery')['ismine'] for item in fixtures)
    assert rpc('getbalances', wallet='offline-recovery')['mine']['trusted'] == 0
    print(json.dumps({'coreExecutableSha256': expected_hash, 'chain': 'main', 'blocks': 0,
        'p2p': False, 'walletReloadMatches': True, 'cases': results, 'dataDirectory': str(data)}))
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
