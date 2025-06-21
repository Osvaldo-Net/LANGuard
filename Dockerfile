FROM python:3.10-slim

# Evita prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instala nmap y dependencias necesarias
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nmap \
        net-tools \
    && pip install --no-cache-dir flask \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia el código
COPY . /app
WORKDIR /app

# Exponer el puerto
EXPOSE 5555

# Comando de inicio
CMD ["python", "app.py"]

