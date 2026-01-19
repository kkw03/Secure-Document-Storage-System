import sqlite3
import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

app = FastAPI()

# 1. Database Connection
conn = sqlite3.connect('vault.db', check_same_thread=False)
cursor = conn.cursor()

# 2. Table Schema (Stores dates and real names)
cursor.execute('''
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_filename TEXT,
        stored_filename TEXT,
        file_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        upload_status TEXT
    )
''')
conn.commit()

# 3. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Storage Folder
UPLOAD_DIR = "server_storage"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"status": "Secure Vault Running"}

# Endpoints

# 5. GET /files: List what is in the DB
@app.get("/files")
def list_files():
    # Fetch ID, Real Name, and Date
    cursor.execute("SELECT id, original_filename, created_at FROM files ORDER BY id DESC")
    files = cursor.fetchall()
    return [
        {"id": f[0], "original_filename": f[1], "created_at": f[2]} 
        for f in files
    ]

# 6. POST /upload: Save File and Metadata
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    original_name: str = Form(...)  #  Receive the real name from React
):
    # Determine where to save the gibberish file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Save physical file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Save Metadata to DB
    cursor.execute(
        """
        INSERT INTO files 
        (original_filename, stored_filename, file_path, upload_status) 
        VALUES (?, ?, ?, ?)
        """, 
        (original_name, file.filename, file_path, "uploaded")
    )
    conn.commit()
    
    return {"status": "Saved"}

# 7. DELETE /files/{id}: Remove from DB + Disk
@app.delete("/files/{file_id}")
def delete_file(file_id: int):
    # Step A: Find the file path
    cursor.execute("SELECT file_path FROM files WHERE id = ?", (file_id,))
    record = cursor.fetchone()
    
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path_on_disk = record[0]

    # Step B: Delete from Disk (Physical cleanup)
    if os.path.exists(file_path_on_disk):
        try:
            os.remove(file_path_on_disk)
            print(f"Deleted physical file: {file_path_on_disk}")
        except Exception as e:
            print(f"Error deleting file: {e}")
    
    # Step C: Delete from DB (Metadata cleanup)
    cursor.execute("DELETE FROM files WHERE id = ?", (file_id,))
    conn.commit()

    return {"status": "Deleted successfully"}

# 8. GET Content Endpoint (Download the gibbberish)
@app.get("/files/{file_id}/content")
def get_file_content(file_id: int):
    # 1. Find the path
    cursor.execute("SELECT file_path, original_filename FROM files WHERE id = ?", (file_id,))
    record = cursor.fetchone()
    
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
        
    file_path = record[0]
    original_name = record[1]
    
    # 2. Check if file exists on disk
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File missing from disk")

    # 3. Return the file content directly
    # Send it as "text/plain" because it's just encrypted text string
    return FileResponse(file_path, media_type="text/plain", filename=original_name)
