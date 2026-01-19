# 1. Base Image: Start with a lightweight version of Linux that has Python installed
# Kind of like buying a laptop with Windows pre-installed.
FROM python:3.9-slim

# 2. Work Directory: Create a folder inside the container to hold the app
WORKDIR /app

# 3. Dependencies: Copy the requirements file and install libraries
# Copy requirements first to use Docker's "Cache" (makes builds faster by skipping reinstalls)
COPY requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn python-multipart

# 4. Copy Code: Move main.py into the container
COPY . .

# 5. Port: Tell the container/cloud that "My App will be listening on Port 8000"
EXPOSE 8000

# 6. Command: Run when the "Start" button is pressed
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]