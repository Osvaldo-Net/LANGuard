FROM python:3.13-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        python3-dev \
        nmap \
        net-tools \
        iproute2 && \
    pip install --no-cache-dir flask requests bcrypt && \
    apt-get purge -y build-essential python3-dev libffi-dev && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /root/.cache

WORKDIR /app
COPY . .

EXPOSE 5555

CMD ["python", "app.py"]
