/* =========================================
   Nobelian Backoffice - Media Manager
   
   Depends on: security.js, api.js, auth.js
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  Auth.requireAuth();

  setupUpload();
  loadMedia();

});


/* =========================================
   Resolve media URL
   Backend stores relative paths like /cloud/filename.jpg
   We need to prefix with the backend base URL
========================================= */

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return API_BASE.replace("/api", "") + url;
}


/* =========================================
   Setup Upload Button
========================================= */

function setupUpload() {

  const uploadBtn = document.getElementById("uploadButton");

  if (!uploadBtn) return;

  uploadBtn.addEventListener("click", async () => {

    const fileInput = document.getElementById("imageFile");
    const status = document.getElementById("uploadStatus");

    const file = fileInput.files[0];

    if (!file) {
      alert("Please select a file");
      return;
    }

    // Client-side file type validation
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif",
      "image/webp", "image/svg+xml", "image/avif"
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Only image files are allowed (JPEG, PNG, GIF, WebP, SVG, AVIF)");
      return;
    }

    // Client-side file size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be 10MB or less");
      return;
    }

    const token = Auth.getToken();

    const formData = new FormData();
    formData.append("file", file);

    status.innerText = "Uploading...";

    try {

      const response = await fetch(`${API_BASE}/media`, {

        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`
        },

        body: formData

      });

      // Handle 401
      if (response.status === 401) {
        localStorage.removeItem("admin_token");
        window.location.href = "/login.html?reason=unauthorized";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Upload failed");
      }

      status.innerText = "Upload successful";

      fileInput.value = "";

      loadMedia();

    } catch (error) {

      console.error("Upload error:", error);

      status.innerText = "Upload failed: " + escapeHtml(error.message);

    }

  });

}


/* =========================================
   Load Media Files
========================================= */

async function loadMedia() {

  const grid = document.getElementById("mediaGrid");

  if (!grid) return;

  grid.innerHTML = "<p>Loading images...</p>";

  try {

    const media = await API.get("/media");

    if (!media || media.length === 0) {

      grid.innerHTML = "<p>No media files found</p>";

      return;

    }

    grid.innerHTML = "";

    media.forEach(item => {

      const fullUrl = resolveMediaUrl(item.url);

      const safeUrl = escapeAttr(fullUrl);
      const safeAlt = escapeAttr(item.alt_text || item.original_name || "");
      const safeId = escapeAttr(item.id);

      const div = document.createElement("div");

      div.className = "media-item";

      div.innerHTML = `
        <img src="${safeUrl}" class="media-thumb" alt="${safeAlt}">

        <input 
          type="text" 
          value="${safeUrl}" 
          readonly
          onclick="this.select()"
        >

        <button class="delete-btn" data-id="${safeId}">Delete</button>
      `;

      grid.appendChild(div);

    });

    attachMediaDeleteHandlers();

  } catch (error) {

    console.error("Media load error:", error);

    grid.innerHTML = "<p>Failed to load media</p>";

  }

}


/* =========================================
   Delete Media
========================================= */

function attachMediaDeleteHandlers() {

  const buttons = document.querySelectorAll(".media-item .delete-btn");

  buttons.forEach(button => {

    button.addEventListener("click", async () => {

      const id = button.dataset.id;

      if (!confirm("Delete this image?")) return;

      try {

        await API.delete(`/media/${encodeURIComponent(id)}`);

        loadMedia();

      } catch (error) {

        console.error("Delete media error:", error);

        alert("Failed to delete image");

      }

    });

  });

}
