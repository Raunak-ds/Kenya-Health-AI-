#!/usr/bin/env python3
import sys
from pathlib import Path as _Path
_ROOT = _Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path: sys.path.insert(0, str(_ROOT))
import subprocess, sys
raise SystemExit(subprocess.call([sys.executable,'-m','pytest','-q']))
