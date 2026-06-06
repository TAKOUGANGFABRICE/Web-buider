"""
Minimal package extractor for SaaS projects.

Supports Python projects using requirements.txt or pyproject.toml.
Outputs a JSON array of package names for agent use cases.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def _normalize_line(line: str) -> str | None:
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    # strip extras and version markers
    pkg = line.split(" ")[0].split(";")[0].split("[")[0].split("==")[0].split("<")[0].split(">")[0].split("~")[0].split("!")[0]
    pkg = pkg.strip()
    return pkg or None


def load_requirements_txt(path: Path) -> list[str]:
    return [pkg for line in path.read_text(encoding="utf-8").splitlines() if (pkg := _normalize_line(line))]


def load_pyproject_toml(path: Path) -> list[str]:
    try:
        import tomllib
    except ModuleNotFoundError:
        import tomli as tomllib

    data = tomllib.loads(path.read_text(encoding="utf-8"))
    project = data.get("project", {})
    deps = project.get("dependencies", [])
    packages: list[str] = []
    for dep in deps:
        # strings or PEP 508 strings
        pkg = _normalize_line(str(dep))
        if pkg:
            packages.append(pkg)
    return packages


def toml_path(path: Path) -> bool:
    return path.suffix.lower() == ".toml"


def discover_packages(root: Path) -> list[str]:
    req = root / "requirements.txt"
    pyproject = root / "pyproject.toml"
    if req.exists():
        return load_requirements_txt(req)
    if pyproject.exists():
        return load_pyproject_toml(pyproject)
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract package names from SaaS project files.")
    parser.add_argument("--root", type=Path, default=Path("."), help="Project root directory")
    parser.add_argument("--json", action="store_true", help="Output as JSON list")
    args = parser.parse_args()

    packages = discover_packages(args.root)
    if packages:
        if args.json:
            print(json.dumps(packages, indent=2))
        else:
            print("\n".join(packages))
        return 0

    print("No packages found. Expected requirements.txt or pyproject.toml.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
