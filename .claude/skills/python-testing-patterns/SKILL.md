---
name: python-testing-patterns
description: Comprehensive testing with pytest, fixtures, mocking, and property-based testing for robust Python applications.
activation_criteria:
  - User asks about Python testing
  - Setting up pytest configuration
  - Creating test fixtures or mocks
  - Property-based testing with Hypothesis
---

# Python Testing Patterns

## Pytest Configuration

### pyproject.toml Setup
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_functions = ["test_*"]
asyncio_mode = "auto"
addopts = [
    "-v",
    "--strict-markers",
    "--cov=src",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-fail-under=80"
]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks tests as integration tests",
]
```

## Fixture Patterns

### Basic Fixtures
```python
import pytest
from typing import Iterator

@pytest.fixture
def sample_user() -> User:
    """Create a sample user for testing."""
    return User(name="Test User", email="test@example.com")

@pytest.fixture
def db_session() -> Iterator[Session]:
    """Provide a database session with rollback."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
```

### Async Fixtures
```python
import pytest_asyncio

@pytest_asyncio.fixture
async def async_client() -> AsyncIterator[AsyncClient]:
    """Provide async HTTP client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture
async def db_session() -> AsyncIterator[AsyncSession]:
    """Provide async database session."""
    async with async_session_maker() as session:
        yield session
        await session.rollback()
```

### Factory Fixtures
```python
from typing import Callable

@pytest.fixture
def user_factory(db_session: Session) -> Callable[..., User]:
    """Factory fixture for creating users."""
    created_users = []
    
    def _create_user(**kwargs) -> User:
        defaults = {"name": "Test", "email": f"test{len(created_users)}@test.com"}
        defaults.update(kwargs)
        user = User(**defaults)
        db_session.add(user)
        db_session.flush()
        created_users.append(user)
        return user
    
    return _create_user
```

## Mocking Patterns

### Basic Mocking
```python
from unittest.mock import Mock, patch, AsyncMock

def test_service_calls_api(mocker):
    """Test that service calls external API."""
    mock_response = Mock()
    mock_response.json.return_value = {"status": "ok"}
    mocker.patch("module.requests.get", return_value=mock_response)
    
    result = service.fetch_data()
    assert result["status"] == "ok"

@pytest.mark.asyncio
async def test_async_service(mocker):
    """Test async service with AsyncMock."""
    mock_fetch = AsyncMock(return_value={"data": "test"})
    mocker.patch("module.fetch_external", mock_fetch)
    
    result = await service.process()
    assert result["data"] == "test"
```

### Context Manager Mocking
```python
def test_file_processing(mocker):
    """Test file processing with mocked file."""
    mock_file = mocker.mock_open(read_data="test content")
    mocker.patch("builtins.open", mock_file)
    
    result = process_file("dummy.txt")
    assert result == "processed: test content"
```

## Property-Based Testing

### Hypothesis Basics
```python
from hypothesis import given, strategies as st, settings

@given(st.text(min_size=1))
def test_string_processing(text: str):
    """Property: processed string should not be empty."""
    result = process_string(text)
    assert len(result) > 0

@given(st.lists(st.integers(), min_size=1))
def test_sort_preserves_length(numbers: list[int]):
    """Property: sorting preserves list length."""
    sorted_nums = sort_numbers(numbers)
    assert len(sorted_nums) == len(numbers)
```

### Custom Strategies
```python
from hypothesis import strategies as st

user_strategy = st.builds(
    User,
    name=st.text(min_size=1, max_size=100),
    email=st.emails(),
    age=st.integers(min_value=18, max_value=120)
)

@given(user_strategy)
def test_user_serialization(user: User):
    """Property: user can be serialized and deserialized."""
    data = user.to_dict()
    restored = User.from_dict(data)
    assert restored == user
```

## Test Organization

### conftest.py Structure
```python
# tests/conftest.py
import pytest
from typing import Iterator

# Shared fixtures
@pytest.fixture(scope="session")
def app() -> FastAPI:
    """Create test application."""
    return create_app(testing=True)

@pytest.fixture(scope="function")
def client(app: FastAPI) -> Iterator[TestClient]:
    """Create test client."""
    with TestClient(app) as client:
        yield client

# Test database
@pytest.fixture(scope="session")
def test_db():
    """Set up test database."""
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)
```

## Best Practices

1. **Use fixtures for setup/teardown** - Don't repeat setup code
2. **Keep tests isolated** - Each test should be independent
3. **Use parametrize for variations** - `@pytest.mark.parametrize`
4. **Test edge cases** - Empty inputs, None values, boundary conditions
5. **Mock external dependencies** - APIs, databases, file systems
6. **Use property-based testing** - Find edge cases automatically
7. **Maintain high coverage** - Aim for >80% coverage
8. **Use meaningful assertions** - Clear error messages
