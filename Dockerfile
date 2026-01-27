FROM python:3.11-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nmap \
        net-tools \
        iproute2 \
        sqlite3 && \
    pip install --no-cache-dir \
        flask \
        requests \
        bcrypt && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN mkdir -p /app/data

EXPOSE 5555

CMD sh -c "python init_db.py && python app.py"
