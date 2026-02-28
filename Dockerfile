FROM python:3.13-alpine

ENV PYTHONUNBUFFERED=1

RUN apk add --no-cache \
        nmap \
        nmap-nselibs \
        net-tools \
        iproute2 \
        sqlite && \
    pip install --no-cache-dir --upgrade \
        "flask>=3.1.3" \
        "werkzeug>=3.1.6" \
        "pip>=25.4" \
        requests \
        bcrypt

WORKDIR /app
COPY . .
RUN mkdir -p /app/data

EXPOSE 5555
CMD ["sh", "-c", "python init_db.py && python app.py"]
