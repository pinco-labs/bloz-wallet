"""Private fixed-destination RPC bridge. Input on stdin, never command-line secrets."""
import base64
from decimal import Decimal
import json
from pathlib import Path
import sys
import urllib.request

allowed = {'getblockchaininfo', 'getnetworkinfo', 'getblockhash', 'scantxoutset',
           'getrawmempool', 'getrawtransaction', 'gettxout', 'estimatesmartfee',
           'getmempoolinfo', 'testmempoolaccept', 'sendrawtransaction'}
request = json.loads(sys.stdin.read(100000))
if set(request) != {'method', 'params'} or request['method'] not in allowed:
    raise SystemExit('RPC non consentita')
settings_path = Path.home() / '.config/bloz-wallet-rpc.json'
settings = json.loads(settings_path.read_text()) if settings_path.exists() else {}
if set(settings) - {'port', 'cookie_path'}:
    raise SystemExit('Configurazione RPC non valida')
port = settings.get('port', 19466)
if type(port) is not int or not 1024 <= port <= 65535:
    raise SystemExit('Porta RPC non valida')
cookie = Path(settings.get('cookie_path', str(Path.home() / '.local/share/bloz-mainnet-readonly/.cookie'))).expanduser()
auth = base64.b64encode(cookie.read_bytes().strip()).decode()
body = json.dumps({'jsonrpc': '2.0', 'id': 1, **request}).encode()
req = urllib.request.Request(f'http://127.0.0.1:{port}/', data=body,
    headers={'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json'})
try:
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req, timeout=80) as response:
        result = json.load(response, parse_float=Decimal)
    if result.get('error'):
        raise RuntimeError('RPC failed')
    print(json.dumps(result['result'], default=lambda value: format(value, 'f')))
except Exception:
    # No cookie, request body or internal daemon errors in the public response.
    raise SystemExit('Nodo mainnet non disponibile o richiesta rifiutata')
