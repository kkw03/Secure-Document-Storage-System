import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import './App.css';

function App() {
  const [file, setFile] = useState(null); 
  const [fileBase64, setFileBase64] = useState(""); 
  const [password, setPassword] = useState("");
  const [encryptedData, setEncryptedData] = useState("");
  const [decryptedData, setDecryptedData] = useState("");
  const [fileType, setFileType] = useState(""); 

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

  // ============================================================
  // CRITICAL UPDATE: CONNECTING TO PYTHON BACKEND
  // ============================================================
  const handleSaveToVault = async () => {
    if (!encryptedData) return alert("Encrypt a file first!");

    const filename = `encrypted_${Date.now()}.txt`;
    
    // 1. Prepare the data to send to Python
    const formData = new FormData();
    const blob = new Blob([encryptedData], { type: "text/plain" });
    formData.append("file", blob, filename);

    try {
      // 2. Try to knock on the Python Server's door (Port 8000)
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("✅ Success! File sent to Python Backend & Logged in SQL Database.");
      } else {
        throw new Error("Server error");
      }
    } catch (error) {
      // 3. Fallback: If Python is offline (or you are on Vercel), use Local Storage
      console.log("Backend offline. Using Local Storage.");
      localStorage.setItem("mySecretFile", encryptedData);
      localStorage.setItem("mySecretType", fileType);
      alert("⚠️ Backend unreachable. Saved to Browser Storage (Hybrid Mode).");
    }
  };

  const handleLoadFromVault = () => {
    const savedData = localStorage.getItem("mySecretFile");
    const savedType = localStorage.getItem("mySecretType");

    if (savedData) {
      setEncryptedData(savedData);
      setFileType(savedType);
      alert("File loaded from vault! Enter password to decrypt.");
    } else {
      alert("Vault is empty!");
    }
  };

  return (
    <div style={{ padding: "50px", fontFamily: "Arial", maxWidth: "700px", margin: "0 auto" }}>
      {/* UPDATED TITLE TO MATCH RESUME */}
      <h1>📂 Secure Document Storage System</h1>
      <p>Status: 🟢 React + Python + SQL Integration</p>
      <hr />

      <div style={{ marginBottom: "20px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h3>1. Select File & Password</h3>
        <input type="file" onChange={handleFileChange} />
        <br /><br />
        <input 
          type="password" 
          placeholder="Enter Secret Key..." 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px", width: "100%" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <button 
          onClick={handleEncrypt}
          style={{ padding: "15px", background: "#007bff", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}
        >
          🔒 1. Encrypt
        </button>
        
        <button 
          onClick={handleSaveToVault}
          style={{ padding: "15px", background: "#6610f2", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}
        >
          💾 2. Save to Backend
        </button>

        <button 
          onClick={handleLoadFromVault}
          style={{ padding: "15px", background: "#fd7e14", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}
        >
          📂 3. Load from Local
        </button>

        <button 
          onClick={handleDecrypt}
          style={{ padding: "15px", background: "#28a745", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}
        >
          🔓 4. Decrypt
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h4>Encrypted Payload:</h4>
          <div style={{ height: "200px", overflow: "auto", background: "#333", color: "#0f0", padding: "10px", fontSize: "10px", fontFamily: "monospace", wordBreak: "break-all" }}>
            {encryptedData || "Waiting..."}
          </div>
        </div>

        <div>
          <h4>Decrypted Result:</h4>
          <div style={{ height: "200px", overflow: "auto", background: "#f8f9fa", padding: "10px", border: "1px solid #ddd" }}>
            {decryptedData ? (
              fileType && fileType.startsWith("image/") ? (
                <img src={decryptedData} alt="Decrypted Secret" style={{ maxWidth: "100%" }} />
              ) : (
                <a href={decryptedData} download="decrypted_file">Download Decrypted File</a>
              )
            ) : "Waiting..."}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;