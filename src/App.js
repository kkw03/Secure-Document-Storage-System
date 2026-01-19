import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import './App.css';

function App() {
  const [file, setFile] = useState(null); 
  const [fileBase64, setFileBase64] = useState(""); 
  const [password, setPassword] = useState("");
  const [encryptedData, setEncryptedData] = useState("");
  const [decryptedData, setDecryptedData] = useState("");
  const [fileType, setFileType] = useState(""); 
  
  // State for Server Files
  const [serverFiles, setServerFiles] = useState([]);

  // Step 1: Handle File Selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileType(selectedFile.type);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileBase64(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Step 2: Encrypt
  const handleEncrypt = () => {
    if (!password) return alert("Set a password!");
    if (!fileBase64) return alert("Select a file!");
    const encrypted = CryptoJS.AES.encrypt(fileBase64, password).toString();
    setEncryptedData(encrypted);
    setDecryptedData(""); 
  };

  // Step 3: Decrypt
  const handleDecrypt = () => {
    if (!encryptedData) return alert("Nothing to decrypt!");
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, password);
      const originalData = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalData) throw new Error("Wrong Password");
      setDecryptedData(originalData);
    } catch (error) {
      alert("Decryption Failed! Wrong Password?");
    }
  };

  // Fetch list of files from Python
  const fetchFileList = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/files");
      const data = await response.json();
      setServerFiles(data);
    } catch (error) {
      console.error("Backend offline");
    }
  };

  // Send the file and its original name to Python
  const handleSaveToVault = async () => {
    if (!encryptedData) return alert("Encrypt a file first!");
    if (!file) return alert("Original file missing!");

    // Name it "encrypted_..." but also send the original name
    const secureFilename = `encrypted_${Date.now()}.txt`;
    
    const formData = new FormData();
    const blob = new Blob([encryptedData], { type: "text/plain" });
    
    // 1. The Physical File
    formData.append("file", blob, secureFilename);
    // 2. The Metadata (Original Name)
    formData.append("original_name", file.name);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        alert("✅ Saved to Server Vault!");
        fetchFileList(); // Refresh the list automatically
      } else {
        throw new Error("Server Error");
      }
    } catch (error) {
      alert("❌ Backend Error. Check console.");
    }
  };

  // Delete File
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this file permanently?")) return;
    try {
        const response = await fetch(`http://127.0.0.1:8000/files/${id}`, { method: "DELETE" });
        if (response.ok) {
            fetchFileList(); // Refresh list
        }
    } catch (error) {
        alert("Error deleting file.");
    }
  };

  // Load Encrypted Data from Server into the App
  const handleLoadFromServer = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/files/${id}/content`);
      if (!response.ok) throw new Error("Failed to load");
      
      // Get the text (the gibberish)
      const text = await response.text();
      
      // Put it into the "Encrypted Payload" state
      setEncryptedData(text);
      setDecryptedData(""); // Clear previous results
      
      alert("⚠️ Encrypted data loaded! Now enter your password and click '3. Decrypt'.");
    } catch (error) {
      alert("Error loading file content.");
    }
  };

  // Load files when app starts
  useEffect(() => {
    fetchFileList();
  }, []);

  return (
    <div style={{ padding: "50px", fontFamily: "Arial", maxWidth: "800px", margin: "0 auto" }}>
      <h1>📂 Secure Document Storage System</h1>
      <p>Status: 🟢 React + Python + SQL (Upgraded)</p>
      <hr />

      {/* INPUT SECTION */}
      <div style={{ marginBottom: "20px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h3>1. Select File & Password</h3>
        <input type="file" onChange={handleFileChange} />
        <br /><br />
        <input 
          type="password" placeholder="Enter Secret Key..." 
          value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px", width: "100%" }}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <button onClick={handleEncrypt} style={{ padding: "15px", background: "#007bff", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>🔒 1. Encrypt</button>
        <button onClick={handleSaveToVault} style={{ padding: "15px", background: "#6610f2", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>💾 2. Save to Vault</button>
        <button onClick={handleDecrypt} style={{ padding: "15px", background: "#28a745", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>🔓 3. Decrypt</button>
      </div>

      {/* SERVER VAULT DISPLAY */}
      <div style={{ marginBottom: "30px", padding: "20px", background: "#f8f9fa", border: "1px solid #ddd", borderRadius: "8px" }}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <h3>☁️ Server Vault (SQL Database)</h3>
            <button onClick={fetchFileList} style={{background: "none", border: "1px solid #ccc", cursor: "pointer", padding: "5px"}}>🔄 Refresh</button>
        </div>
        
        {serverFiles.length === 0 ? <p>Vault is empty.</p> : (
            <table style={{width: "100%", borderCollapse: "collapse", marginTop: "10px"}}>
                <thead>
                    <tr style={{textAlign: "left", background: "#eee"}}>
                        <th style={{padding: "8px"}}>ID</th>
                        <th>Original Filename</th>
                        <th>Upload Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {serverFiles.map(f => (
                        <tr key={f.id} style={{borderBottom: "1px solid #ddd"}}>
                            <td style={{padding: "8px"}}>{f.id}</td>
                            <td><strong>{f.original_filename}</strong></td>
                            <td style={{fontSize: "12px", color: "#666"}}>{f.created_at}</td>
                            <td>
                                {/* Load Button */}
                                <button
                                    onClick = {() => handleLoadFromServer(f.id)}
                                    style={{background: "#17a2b8", color: "white", border: "none", padding: "5px 10px", borderRadius: "3px", cursor: "pointer", marginRight: "5px"}}
                                >
                                  ⬇️ Load
                                </button>

                                {/* Delete Button */}
                                <button 
                                    onClick={() => handleDelete(f.id)}
                                    style={{background: "#dc3545", color: "white", border: "none", padding: "5px 10px", borderRadius: "3px", cursor: "pointer"}}
                                >
                                    ❌ Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>

      {/* DEBUG VIEW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h4>Encrypted Payload:</h4>
          <div style={{ height: "100px", overflow: "auto", background: "#333", color: "#0f0", padding: "10px", fontSize: "10px", fontFamily: "monospace", wordBreak: "break-all" }}>
            {encryptedData || "Waiting..."}
          </div>
        </div>
        <div>
          <h4>Decrypted Result:</h4>
          <div style={{ height: "100px", overflow: "auto", background: "#fff", padding: "10px", border: "1px solid #ddd" }}>
            {decryptedData ? (fileType && fileType.startsWith("image/") ? <img src={decryptedData} alt="Decrypted" style={{ maxWidth: "100%" }} /> : <a href={decryptedData} download="decrypted_file">Download File</a>) : "Waiting..."}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;