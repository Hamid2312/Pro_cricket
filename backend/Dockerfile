FROM python:3.11-slim

WORKDIR /app

# install dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copy full project
COPY . .

# expose port
EXPOSE 10000

# start app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]