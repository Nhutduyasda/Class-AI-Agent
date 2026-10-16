"""LOCAL terminal only; masked prompt; format preflight only; never calls Azure."""
import getpass
import os
from pathlib import Path
import subprocess
import sys

if not sys.stdin.isatty() or not sys.stderr.isatty():
    sys.exit('BLOCKED: requires a private local interactive terminal; no secret read.')
# Do not invoke via a recorded/shared terminal or an agent-controlled PTY.
secret = getpass.getpass('Existing Azure Speech key (hidden; local preflight only): ')
if not secret:
    sys.exit('BLOCKED: empty credential.')
env = os.environ.copy()
for name in ('SPEECH_KEY', 'SPEECH_STS_TOKEN', 'SPEECH_ENTRA_ACCESS_TOKEN', 'SPEECH_BEARER_TOKEN'):
    env.pop(name, None)
env.update(SPEECH_AUTH_MODE='key', SPEECH_KEY=secret)
try:
    result = subprocess.run(['node', str(Path(__file__).with_name('auth-preflight.mjs'))], env=env, check=False)
    sys.exit(result.returncode)
finally:
    env.pop('SPEECH_KEY', None)
    secret = None
