FROM apache/superset:latest

USER root
RUN uv pip install --python /app/.venv/bin/python psycopg2-binary redis
USER superset
