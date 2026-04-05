# Python Package Structure: Industry Standard Refactoring

Restructure the `contextractor-engine` package to follow Python packaging industry standards.

## Research Summary

### The Two Standard Layouts

Python has two accepted package layouts, both documented by the [Python Packaging Authority (PyPA)](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/):

#### 1. Src Layout (Recommended by pytest, pyOpenSci, Scientific Python)

```
project/
├── pyproject.toml
├── src/
│   └── package_name/      ← Package directory = import name
│       ├── __init__.py
│       └── module.py
└── tests/
```

**Why the nested `src/package_name/`?**
- The `src/` folder is a **barrier** that prevents Python from accidentally importing local source
- The `package_name/` folder defines the **import name** (`from package_name import ...`)
- Both are required: `src/` for isolation, `package_name/` for Python's import system

**Used by:** pytest, pip, virtualenv, attrs, black, mypy

#### 2. Flat Layout (Common, simpler)

```
project/
├── pyproject.toml
├── package_name/          ← Package directory = import name (no src/)
│   ├── __init__.py
│   └── module.py
└── tests/
```

**Why no `src/`?**
- Simpler structure, less nesting
- Works fine with modern tooling and editable installs
- The package directory still defines the import name

**Used by:** requests, flask, django, numpy, pandas

### Industry Consensus (2024-2025)

From [pyOpenSci Python Package Guide](https://www.pyopensci.org/python-package-guide/package-structure-code/python-package-structure.html):
> "pyOpenSci strongly suggests, but does not require, that you use the src/ layout"

From [pytest documentation](https://docs.pytest.org/en/7.1.x/explanation/goodpractices.html):
> "Generally, but especially if you use the default import mode prepend, it is strongly suggested to use a src layout"

From [uv documentation](https://docs.astral.sh/uv/):
> uv defaults to flat layout, but `uv init --package` creates src layout

**Key insight:** Both layouts are valid. The critical rule is:
> **The folder containing `__init__.py` MUST be named exactly what you want to import.**

### Why NOT Put Files Directly in `src/`

If you structure like this:
```
project/
├── src/
│   ├── __init__.py    ← Files directly in src/
│   └── module.py
```

Then your import becomes `from src import ...` which is:
1. Not a meaningful package name
2. Conflicts with every other project using this anti-pattern
3. Requires complex build-time remapping that breaks development workflows

### Monorepo Considerations

From [uv workspaces documentation](https://docs.astral.sh/uv/concepts/workspaces/) and [community examples](https://github.com/JasperHG90/uv-monorepo):

```
monorepo/
├── pyproject.toml              # Workspace root
├── packages/
│   └── my_package/             # Package directory (underscore preferred)
│       ├── pyproject.toml
│       ├── src/
│       │   └── my_package/     # Import name
│       │       └── __init__.py
│       └── tests/
└── apps/
    └── my_app/
        └── ...
```

**Naming conventions:**
- Directory names: use underscores (`my_package`) - matches Python identifier rules
- Distribution names (PyPI): can use hyphens (`my-package`) - defined in pyproject.toml
- Import names: must use underscores (`from my_package import ...`)

## Current Structure (Contextractor)

```
packages/
└── contextractor-engine/           # ❌ Hyphen in directory name
    ├── pyproject.toml
    ├── src/
    │   └── contextractor_engine/   # ✅ Correct import name
    │       ├── __init__.py
    │       └── ...
    └── tests/
```

**Issues:**
1. Directory name `contextractor-engine` uses hyphen (not Pythonic)
2. Mismatched: directory uses hyphen, import uses underscore

## Recommended Structure

### Option A: Src Layout (Current, just fix naming)

```
packages/
└── contextractor_engine/           # ✅ Underscore (matches import)
    ├── pyproject.toml
    ├── src/
    │   └── contextractor_engine/   # ✅ Import name
    │       ├── __init__.py
    │       ├── extractor.py
    │       ├── models.py
    │       ├── utils.py
    │       └── py.typed
    └── tests/
        └── test_extractor.py
```

**pyproject.toml:**
```toml
[project]
name = "contextractor-engine"  # Distribution name (can use hyphen)

[tool.hatch.build.targets.wheel]
packages = ["src/contextractor_engine"]
```

### Option B: Flat Layout (Simpler)

```
packages/
└── contextractor_engine/           # ✅ Underscore
    ├── pyproject.toml
    ├── contextractor_engine/       # ✅ Import name (no src/)
    │   ├── __init__.py
    │   ├── extractor.py
    │   ├── models.py
    │   ├── utils.py
    │   └── py.typed
    └── tests/
        └── test_extractor.py
```

**pyproject.toml:**
```toml
[project]
name = "contextractor-engine"  # Distribution name

[tool.hatch.build.targets.wheel]
packages = ["contextractor_engine"]
```

## Recommendation

**Use Option A (Src Layout)** because:
1. Already using src layout - minimal change needed
2. pytest and scientific Python community recommend it
3. Prevents accidental local imports during development
4. Only change needed: rename outer directory from hyphen to underscore

## Implementation Steps

### Phase 1: Rename Package Directory

```bash
# Rename directory (hyphen → underscore)
git mv packages/contextractor-engine packages/contextractor_engine
```

### Phase 2: Update Root pyproject.toml

Update workspace members path:
```toml
[tool.uv.workspace]
members = ["packages/*", "apps/*"]
```

No change needed - glob pattern still matches.

### Phase 3: Update Actor Dependency

In `apps/contextractor/pyproject.toml`, the workspace reference remains the same:
```toml
[tool.uv.sources]
contextractor-engine = { workspace = true }
```

The distribution name `contextractor-engine` is defined in the package's pyproject.toml, not the directory name.

### Phase 4: Update Dockerfile

```dockerfile
# Update COPY path
COPY --chown=myuser:myuser packages/contextractor_engine/ ./packages/contextractor_engine/
```

### Phase 5: Update Build Script

In `scripts/build-engine.sh`:
```bash
# No change needed - uses package name from pyproject.toml
uv build --package contextractor-engine --out-dir dist/
```

### Phase 6: Verify

```bash
# Sync dependencies
uv sync

# Run engine tests
uv run pytest packages/contextractor_engine/tests/ -v

# Run actor locally
uv run --directory apps/contextractor python -m src
```

### Phase 7: Commit

```bash
git add -A
git commit -m "Rename package directory to use underscore (Python convention)

- Rename packages/contextractor-engine/ → packages/contextractor_engine/
- Update Dockerfile COPY path
- No import changes needed (import name unchanged)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Directory | `packages/contextractor-engine/` | `packages/contextractor_engine/` |
| Distribution name | `contextractor-engine` | `contextractor-engine` (unchanged) |
| Import name | `contextractor_engine` | `contextractor_engine` (unchanged) |
| Structure | src layout | src layout (unchanged) |

**The only change is the outer directory name: hyphen → underscore.**

This aligns with Python naming conventions where:
- Directories and import names use underscores
- Distribution names (PyPI) can use hyphens
- The nested `src/contextractor_engine/` is required for Python's import system

## References

- [PyPA: src layout vs flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/)
- [pyOpenSci Python Package Guide](https://www.pyopensci.org/python-package-guide/package-structure-code/python-package-structure.html)
- [pytest Good Integration Practices](https://docs.pytest.org/en/7.1.x/explanation/goodpractices.html)
- [Hatch Build Configuration](https://hatch.pypa.io/1.13/config/build/)
- [uv Workspaces](https://docs.astral.sh/uv/concepts/workspaces/)
- [Example uv Monorepo](https://github.com/JasperHG90/uv-monorepo)
