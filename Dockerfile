FROM python:3.10-slim

RUN apt-get update && apt-get install -y nmap && pip install flask

COPY . /app
WORKDIR /app

EXPOSE 5555
CMD ["python", "app.py"]
