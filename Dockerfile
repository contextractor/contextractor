FROM apify/actor-python-playwright:3.14-1.57.0

USER myuser

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy workspace root files
COPY --chown=myuser:myuser pyproject.toml uv.lock ./

# Copy engine package
COPY --chown=myuser:myuser packages/contextractor_engine/ ./packages/contextractor_engine/

# Copy actor package
COPY --chown=myuser:myuser apps/contextractor-apify/ ./apps/contextractor-apify/

# Install dependencies
RUN uv sync --frozen --no-dev --directory apps/contextractor-apify

# Compile
RUN python3 -m compileall -q apps/contextractor-apify/src/

WORKDIR /home/myuser/apps/contextractor-apify
CMD ["uv", "run", "python3", "-m", "src"]
