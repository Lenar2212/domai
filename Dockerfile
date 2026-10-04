FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
ENV DOMAI_DATA_DIR=/var/data
EXPOSE 8000
CMD ["python", "backend/server.py"]
