import { useState } from "react";

import { uploadChallenge } from "../services/reviewerApi";

export default function AdminPage({ csrfToken }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const result = await uploadChallenge(file, csrfToken);
      setMessage(`Challenge uploaded: ${result.challenge_id}`);
      setFile(null);
    } catch (error) {
      setMessage(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="site-main">
      <div className="workspace-hero-card">
        <div className="workspace-hero-main">
          <h1>Admin Panel</h1>
          <p>Upload new challenges for the training platform.</p>

          <form onSubmit={handleUpload} className="auth-form">
            <div className="field-label">
              <label>Challenge ZIP File</label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
            </div>
            <button type="submit" className="button-primary" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Challenge"}
            </button>
          </form>

          {message && (
            <div className={`auth-${message.includes("failed") ? "error" : "intent"}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}