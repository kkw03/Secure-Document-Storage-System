import sqlite3 # <--- The Database Tool
import os
import shutil
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 1. Database Setup (The "Filing Cabinet")
# This creates a file named 'vault.db' to store your data records.
conn = sqlite3.connect('vault.db', check_same_thread=False)
cursor = conn.cursor()

# 2. Create the Table (If it doesn't exist)
# We are creating a spreadsheet with columns: ID, Filename, and Path
cursor.execute('''
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        file_path TEXT,
        upload_status TEXT
    )
''')
conn.commit() # Save the changes to the DB

# 3. CORS Setup (Allow React to talk to us)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Storage Folder Setup
UPLOAD_DIR = "server_storage"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"status": "Database & Server Running"}

# 5. The Upload Logic (File + Database)
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # A. Define where the file goes on the hard drive
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # B. Save the actual binary file (The I/O Operation)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # C. Save the RECORD to the Database (The SQL Operation)
    # This is what makes you a Backend Engineer. You are tracking data.
    cursor.execute(
        "INSERT INTO files (filename, file_path, upload_status) VALUES (?, ?, ?)", 
        (file.filename, file_path, "uploaded")
    )
    conn.commit() # Lock it in
    
    return {
        "filename": file.filename, 
        "status": "Saved to Disk & Logged in SQLite Database"
    }
