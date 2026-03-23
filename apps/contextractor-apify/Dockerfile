FROM apify/actor-python-playwright:3.14-1.57.0

USER myuser

# Copy wheel first (for layer caching)
COPY --chown=myuser:myuser dist/contextractor_engine-0.1.0-py3-none-any.whl ./dist/

# Install dependencies with pip
RUN pip install --no-cache-dir \
    "./dist/contextractor_engine-0.1.0-py3-none-any.whl" \
    "apify>=2.0.0,<4.0.0" \
    "crawlee[playwright]>=0.4.0" \
    "browserforge<1.2.4"

# Copy source code
COPY --chown=myuser:myuser src/ ./src/
COPY --chown=myuser:myuser .actor/ ./.actor/

# Compile Python files
RUN python3 -m compileall -q src/

CMD ["python3", "-m", "src"]
