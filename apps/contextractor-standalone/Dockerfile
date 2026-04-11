FROM mcr.microsoft.com/playwright/python:v1.50.0-noble

LABEL org.opencontainers.image.source="https://github.com/contextractor/contextractor"
LABEL org.opencontainers.image.description="Extract clean, readable content from any website"
LABEL org.opencontainers.image.licenses="Apache-2.0"

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Create non-root user (required for Chromium sandbox)
RUN useradd -m -s /bin/bash ctxuser

WORKDIR /app

# Copy workspace root files
COPY pyproject.toml uv.lock ./

# Copy engine package
COPY packages/contextractor_engine/ ./packages/contextractor_engine/

# Copy standalone CLI package
COPY apps/contextractor-standalone/ ./apps/contextractor-standalone/

# Install dependencies
RUN uv sync --frozen --no-dev --directory apps/contextractor-standalone

# Install Chromium for Playwright
RUN uv run --directory apps/contextractor-standalone playwright install --with-deps chromium

# Default output directory and writable app dir for crawlee storage
RUN mkdir -p /output && chown -R ctxuser:ctxuser /app /output

# Disable Chromium sandbox (standard for Docker containers)
ENV CONTEXTRACTOR_NO_SANDBOX=1

# Switch to non-root user
USER ctxuser

ENTRYPOINT ["uv", "run", "--directory", "apps/contextractor-standalone", "contextractor"]
CMD ["--help"]
