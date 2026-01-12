# 1. Base Image: Start with a lightweight version of Linux that has Python installed
# Think of this as buying a laptop with Windows pre-installed.
FROM python:3.9-slim

# 2. Work Directory: Create a folder inside the container to hold our app
WORKDIR /app

# 3. Dependencies: Copy the requirements file and install libraries
# We copy requirements FIRST to use Docker's "Cache" (makes builds faster)
COPY requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn python-multipart

# 4. Copy Code: Move your main.py into the container
COPY . .

# 5. Port: Tell the cloud "I will be listening on Port 8000"
EXPOSE 8000

# 6. Command: What to run when the "Start" button is pressed
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]