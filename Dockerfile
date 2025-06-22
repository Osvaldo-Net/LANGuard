FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive

# Instala librerías necesarias del sistema para bcrypt
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        python3-dev \
        nmap \
        net-tools \
    && pip install --no-cache-dir flask requests bcrypt \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . /app
WORKDIR /app

EXPOSE 5555

CMD ["python", "app.py"]



