"""Manage only our dedicated, wallet-disabled mainnet node in WSL."""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['start', 'status', 'stop'])
args = parser.parse_args()
os.umask(0o077)
binary = Path.home() / '.local/opt/bloz-cli-v1.0.0-rc38/bitcoind'
data = Path.home() / '.local/share/bloz-mainnet-readonly'
port = 19466
genesis = '44c1a8c852b3eda21966e1ddb6b0807e22488dffe8a270bf24bf1fa2d66c13bd'
assert hashlib.sha256(binary.read_bytes()).hexdigest() == '60bc037f5b5241da35bf4676aaa94c1fe0314d7d227f9d0f6e602c8101eda01f'

def rpc(method, params=None):
    auth = base64.b64encode((data / '.cookie').read_bytes().strip()).decode()
    request = urllib.request.Request(f'http://127.0.0.1:{port}/',
        data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or []}).encode(),
        headers={'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json'})
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=30) as response:
        result = json.load(response)
    if result.get('error'):
        raise RuntimeError(f'{method} failed')
    return result['result']

if args.action == 'start':
    data.mkdir(parents=True, exist_ok=True)
    try:
        running = rpc('getblockchaininfo')['chain'] == 'main'
    except (OSError, ValueError):
        running = False
    if not running:
        subprocess.run([str(binary), '-chain=main', f'-datadir={data}', '-nosettings',
            '-daemonwait', '-server=1', '-disablewallet=1', '-listen=0', '-discover=0',
            '-rpcbind=127.0.0.1', f'-rpcport={port}', '-prune=550', '-dbcache=128',
            '-maxconnections=8', '-par=1', '-printtoconsole=0'], check=True, timeout=60)
assert rpc('getblockhash', [0]) == genesis
if args.action == 'start' and rpc('getnetworkinfo')['connections'] == 0:
    # Official rc38 chainparams_seed_main: d9 a0 2e 3d, port 0x2012.
    rpc('addnode', ['217.160.46.61:8210', 'onetry'])
info = rpc('getblockchaininfo')
assert info['chain'] == 'main'
if args.action == 'stop':
    rpc('stop')
    print('Dedicated mainnet node stopping.')
else:
    network = rpc('getnetworkinfo')
    methods = rpc('help')
    assert 'createwallet' not in methods and 'walletpassphrase' not in methods
    result = {'chain': 'main', 'blocks': info['blocks'], 'headers': info['headers'],
        'initialBlockDownload': info['initialblockdownload'],
        'verificationProgress': info['verificationprogress'], 'connections': network['connections'],
        'pruned': info['pruned'], 'walletEnabled': False, 'rpc': '127.0.0.1:19466',
        'dataDirectory': str(data), 'realFundsUsed': False}
    print(json.dumps(result, indent=2))
