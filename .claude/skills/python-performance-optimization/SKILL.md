---
name: python-performance-optimization
description: Performance profiling, optimization techniques, and bottleneck identification for high-performance Python applications.
activation_criteria:
  - User asks about Python performance
  - Profiling and optimization tasks
  - Memory usage concerns
  - CPU-bound or I/O-bound optimization
---

# Python Performance Optimization

## Profiling Tools

### CPU Profiling with cProfile
```python
import cProfile
import pstats
from io import StringIO

def profile_function(func):
    """Decorator for profiling functions."""
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        result = func(*args, **kwargs)
        profiler.disable()
        
        # Print stats
        stream = StringIO()
        stats = pstats.Stats(profiler, stream=stream)
        stats.sort_stats('cumulative')
        stats.print_stats(20)
        print(stream.getvalue())
        
        return result
    return wrapper
```

### Line Profiling with line_profiler
```python
# Install: pip install line_profiler
# Usage: kernprof -l -v script.py

@profile  # Add this decorator
def slow_function():
    result = []
    for i in range(10000):
        result.append(expensive_operation(i))
    return result
```

### Memory Profiling
```python
from memory_profiler import profile

@profile
def memory_intensive_function():
    """Profile memory usage line by line."""
    large_list = [i ** 2 for i in range(1000000)]
    processed = [x for x in large_list if x % 2 == 0]
    return sum(processed)
```

## Optimization Techniques

### Use Built-in Functions
```python
# Slow
total = 0
for item in items:
    total += item

# Fast - use built-in sum()
total = sum(items)

# Slow
result = []
for item in items:
    if condition(item):
        result.append(transform(item))

# Fast - use list comprehension
result = [transform(item) for item in items if condition(item)]
```

### Generator Expressions for Memory Efficiency
```python
# Memory intensive - creates full list
squared = [x ** 2 for x in range(10_000_000)]
total = sum(squared)

# Memory efficient - generates on demand
squared = (x ** 2 for x in range(10_000_000))
total = sum(squared)
```

### Caching with functools
```python
from functools import lru_cache, cache

@lru_cache(maxsize=128)
def expensive_computation(n: int) -> int:
    """Cache expensive computation results."""
    return sum(i ** 2 for i in range(n))

# Python 3.9+ unlimited cache
@cache
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

### String Concatenation
```python
# Slow - creates new string each iteration
result = ""
for s in strings:
    result += s

# Fast - join is O(n)
result = "".join(strings)

# For formatted strings, use f-strings
name, age = "Alice", 30
result = f"Name: {name}, Age: {age}"  # Fastest
```

### Dictionary Operations
```python
# Use dict.get() with default
value = d.get(key, default)  # Avoid KeyError handling

# Use collections.defaultdict
from collections import defaultdict
word_counts = defaultdict(int)
for word in words:
    word_counts[word] += 1

# Use Counter for counting
from collections import Counter
word_counts = Counter(words)
```

## Async for I/O-Bound Tasks
```python
import asyncio
import aiohttp

async def fetch_all(urls: list[str]) -> list[str]:
    """Fetch URLs concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# Much faster than sequential requests
results = asyncio.run(fetch_all(urls))
```

## Multiprocessing for CPU-Bound Tasks
```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

def cpu_intensive(n: int) -> int:
    """CPU-bound computation."""
    return sum(i ** 2 for i in range(n))

def parallel_compute(numbers: list[int]) -> list[int]:
    """Run CPU-bound tasks in parallel."""
    with ProcessPoolExecutor(max_workers=multiprocessing.cpu_count()) as executor:
        results = list(executor.map(cpu_intensive, numbers))
    return results
```

## Data Structure Selection

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| Fast lookup | `dict`, `set` | O(1) average |
| Ordered data | `list` | O(1) append |
| Queue operations | `collections.deque` | O(1) both ends |
| Counting | `collections.Counter` | Optimized for counting |
| Sorted data | `sortedcontainers.SortedList` | O(log n) insert |

## NumPy for Numerical Operations
```python
import numpy as np

# Slow - Python loop
result = []
for i in range(len(a)):
    result.append(a[i] * b[i])

# Fast - NumPy vectorized
result = np.array(a) * np.array(b)

# Even faster - preallocate
a = np.array(a)
b = np.array(b)
result = a * b
```

## Best Practices

1. **Profile first** - Don't optimize prematurely
2. **Use built-ins** - They're implemented in C
3. **Choose right data structures** - dict/set for lookups
4. **Use generators** - For memory efficiency
5. **Cache expensive operations** - functools.lru_cache
6. **Vectorize with NumPy** - For numerical operations
7. **Use async for I/O** - aiohttp, asyncpg
8. **Multiprocessing for CPU** - ProcessPoolExecutor
