import sys
import tomllib
from pathlib import Path

req = Path("requirements.txt")
if not req.exists():
    sys.exit(0)

text = req.read_text(encoding="utf-8").strip()
if not text:
    sys.exit(0)

# Minimal parser: extract package names only
with req.open("rb") as f:
    data = tomllib.load(f)

pkg = data.get("project", {}).get("dependencies", [])
print("\n".join(pkg))
