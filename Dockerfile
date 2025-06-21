FROM python:3.10-slim

# Evita prompts interactivos
ENV DEBIAN_FRONTEND=noninteractive

# Instala nmap, net-tools y dependencias de Python
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        nmap \
        net-tools \
    && pip install --no-cache-dir flask requests \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia el código fuente
COPY . /app
WORKDIR /app

# Puerto expuesto
EXPOSE 5555

# Comando de inicio
CMD ["python", "app.py"]



