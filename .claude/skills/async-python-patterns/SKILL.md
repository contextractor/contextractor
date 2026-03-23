---
name: async-python-patterns
description: Advanced async/await patterns with asyncio, aiohttp, and trio for high-performance Python applications.
activation_criteria:
  - User asks about async Python programming
  - Project involves asyncio, aiohttp, or trio
  - Need for concurrent I/O operations
  - FastAPI or async web development
---

# Async Python Patterns

## Core Concepts

### Event Loop Fundamentals
```python
import asyncio

async def main():
    # Your async code here
    await asyncio.sleep(1)

# Python 3.12+ recommended way
asyncio.run(main())
```

### Concurrent Execution Patterns

#### Gather for Parallel Tasks
```python
async def fetch_all(urls: list[str]) -> list[str]:
    """Fetch multiple URLs concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)
```

#### TaskGroup (Python 3.11+)
```python
async def process_items(items: list[Item]) -> list[Result]:
    """Process items with structured concurrency."""
    results = []
    async with asyncio.TaskGroup() as tg:
        for item in items:
            task = tg.create_task(process_item(item))
            results.append(task)
    return [task.result() for task in results]
```

### Async Context Managers
```python
from contextlib import asynccontextmanager
from typing import AsyncIterator

@asynccontextmanager
async def get_db_connection() -> AsyncIterator[Connection]:
    """Async context manager for database connections."""
    conn = await create_connection()
    try:
        yield conn
    finally:
        await conn.close()
```

### Async Generators
```python
async def stream_data(source: str) -> AsyncIterator[bytes]:
    """Stream data asynchronously."""
    async with aiohttp.ClientSession() as session:
        async with session.get(source) as response:
            async for chunk in response.content.iter_chunked(8192):
                yield chunk
```

## Common Patterns

### Semaphore for Rate Limiting
```python
async def rate_limited_fetch(
    urls: list[str],
    max_concurrent: int = 10
) -> list[Response]:
    """Fetch URLs with concurrency limit."""
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def fetch_with_limit(url: str) -> Response:
        async with semaphore:
            return await fetch_url(url)
    
    return await asyncio.gather(*[fetch_with_limit(url) for url in urls])
```

### Timeout Handling
```python
async def fetch_with_timeout(url: str, timeout: float = 30.0) -> str:
    """Fetch URL with timeout."""
    try:
        async with asyncio.timeout(timeout):
            return await fetch_url(url)
    except TimeoutError:
        raise FetchError(f"Timeout fetching {url}")
```

### Retry Pattern with Exponential Backoff
```python
async def retry_async(
    func: Callable[..., Awaitable[T]],
    *args,
    max_retries: int = 3,
    base_delay: float = 1.0,
    **kwargs
) -> T:
    """Retry async function with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt)
            await asyncio.sleep(delay)
```

## Best Practices

1. **Use `asyncio.run()` as entry point** - Don't manually manage event loops
2. **Prefer TaskGroup over gather** - Better error handling in Python 3.11+
3. **Always use timeouts** - Prevent hanging operations
4. **Use semaphores for resource limits** - Prevent overwhelming services
5. **Avoid blocking calls** - Use `run_in_executor` for sync operations
6. **Structure concurrency properly** - Use async context managers
7. **Handle cancellation gracefully** - Check for CancelledError
8. **Use async-native libraries** - aiohttp, aiocache, asyncpg, etc.

## Anti-Patterns to Avoid

- Running sync code in async functions without executor
- Creating event loops manually when `asyncio.run()` suffices
- Using `asyncio.wait()` without proper done/pending handling
- Ignoring cancellation exceptions
- Not closing resources properly (use async context managers)
