---
name: python-scaffold
description: Scaffold production-ready Python projects with modern tooling. Creates project structure with uv, ruff, pytest, and modern Python patterns. Use for FastAPI microservices, CLI tools, libraries, and data applications.
---

# Python Project Scaffold

Create a production-ready Python project with modern tooling and best practices.

## Usage

```
/scaffold:python-scaffold <project-type> [project-name]
```

## Project Types

### `fastapi-microservice`
Production-ready FastAPI microservice with:
- FastAPI with Pydantic v2 models
- Async SQLAlchemy with PostgreSQL
- Docker and docker-compose setup
- pytest with async fixtures
- Pre-commit hooks with ruff
- Health checks and structured logging

### `cli-tool`
Modern CLI application with:
- Click or Typer for CLI framework
- Rich for terminal output
- Comprehensive argument parsing
- Configuration file support
- Packaging for distribution

### `library`
Reusable Python library with:
- src/ layout structure
- pyproject.toml configuration
- pytest with coverage
- Documentation with mkdocs
- GitHub Actions CI/CD
- Semantic versioning setup

### `data-pipeline`
Data processing application with:
- Async data processing patterns
- Pydantic for data validation
- Structured logging
- Error handling and retries
- Performance monitoring

### `apify-actor`
Apify actor with:
- Crawlee integration
- Apify SDK setup
- Input/output schemas
- Docker deployment
- Local testing setup

## Project Structure

All projects include:

```
{project-name}/
├── src/
│   └── {package_name}/
│       ├── __init__.py
│       └── main.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_main.py
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── .python-version
├── pyproject.toml
├── README.md
└── uv.lock
```

## Modern Tooling

### Package Management with uv
```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Install dependencies
uv pip install -e ".[dev]"

# Add new dependency
uv add <package>
```

### Code Quality with ruff
```toml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM", "S"]
ignore = ["S101"]

[tool.ruff.format]
quote-style = "double"
```

### Testing with pytest
```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "-v --cov=src --cov-report=term-missing"
```

### Type Checking with mypy
```toml
# pyproject.toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
```

## Execution

When invoked, this command will:

1. **Analyze Context**: Check existing project structure and requirements
2. **Create Structure**: Generate the complete project scaffolding
3. **Configure Tooling**: Set up pyproject.toml with all modern tools
4. **Initialize Git**: Create .gitignore and initial commit
5. **Set Up Testing**: Configure pytest with appropriate fixtures
6. **Document**: Generate README with setup instructions

## Activated Skills

This command activates these skills when executed:
- `async-python-patterns` - For async project types
- `python-testing-patterns` - For test setup
- `uv-package-manager` - For dependency management
- `python-packaging` - For library projects
