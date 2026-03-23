---
name: python-packaging
description: Modern Python packaging with pyproject.toml, src layout, and distribution best practices for libraries and applications.
activation_criteria:
  - User asks about Python packaging
  - Creating a distributable Python library
  - Setting up pyproject.toml
  - Publishing to PyPI
---

# Python Packaging

## Modern Project Structure

### src Layout (Recommended)
```
my-package/
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── core.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_core.py
├── docs/
├── .github/
│   └── workflows/
├── pyproject.toml
├── README.md
├── LICENSE
└── CHANGELOG.md
```

## pyproject.toml Configuration

### Complete Example
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-package"
version = "0.1.0"
description = "A short description of the package"
readme = "README.md"
license = {file = "LICENSE"}
requires-python = ">=3.11"
authors = [
    {name = "Your Name", email = "you@example.com"}
]
keywords = ["keyword1", "keyword2"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Typing :: Typed",
]
dependencies = [
    "httpx>=0.25.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
    "pytest-asyncio>=0.21.0",
    "ruff>=0.1.0",
    "mypy>=1.0.0",
]
docs = [
    "mkdocs>=1.5.0",
    "mkdocs-material>=9.0.0",
]

[project.urls]
Homepage = "https://github.com/user/my-package"
Documentation = "https://my-package.readthedocs.io"
Repository = "https://github.com/user/my-package"
Changelog = "https://github.com/user/my-package/blob/main/CHANGELOG.md"

[project.scripts]
my-cli = "my_package.cli:main"

[project.entry-points."my_package.plugins"]
plugin1 = "my_package.plugins.plugin1:Plugin1"

[tool.hatch.build.targets.sdist]
include = [
    "/src",
    "/tests",
]

[tool.hatch.build.targets.wheel]
packages = ["src/my_package"]
```

## Version Management

### Single Source of Truth
```python
# src/my_package/__init__.py
__version__ = "0.1.0"
```

```toml
# pyproject.toml
[project]
dynamic = ["version"]

[tool.hatch.version]
path = "src/my_package/__init__.py"
```

### Semantic Versioning
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Building and Publishing

### Build Commands
```bash
# Install build tools
uv pip install build twine

# Build distributions
python -m build

# Check built package
twine check dist/*
```

### Publishing to PyPI
```bash
# Test PyPI (recommended first)
twine upload --repository testpypi dist/*

# Production PyPI
twine upload dist/*
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/publish.yml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Build
        run: |
          pip install build
          python -m build
      - name: Publish
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          password: ${{ secrets.PYPI_API_TOKEN }}
```

## Type Hints and py.typed

### Mark Package as Typed
```
src/my_package/
├── __init__.py
├── py.typed        # Empty file marking package as typed
└── core.py
```

### pyproject.toml for Typed Packages
```toml
[tool.mypy]
packages = ["my_package"]
strict = true
warn_return_any = true
warn_unused_configs = true
```

## Best Practices

1. **Use src layout** - Prevents import issues during development
2. **Single version source** - Keep version in one place
3. **Comprehensive metadata** - Good classifiers and keywords
4. **Type hints** - Include py.typed marker
5. **Test before publish** - Use TestPyPI first
6. **Automate releases** - GitHub Actions for CI/CD
7. **Include tests in sdist** - For reproducibility
8. **Lock development dependencies** - Use uv.lock or requirements-dev.txt
