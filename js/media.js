/* =========================================
   Nobelian Backoffice - Media Manager
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  Auth.requireAuth();

  setupUpload();
  loadMedia();

});


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

    const token = Auth.getToken();

    const formData = new FormData();
    formData.append("file", file);

    status.innerText = "Uploading...";

    try {

      const response = await fetch("https://api.nobelian.com/upload", {

        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`
        },

        body: formData

      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      status.innerText = "Upload successful";

      fileInput.value = "";

      loadMedia();

    } catch (error) {

      console.error("Upload error:", error);

      status.innerText = "Upload failed";

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

      const div = document.createElement("div");

      div.className = "media-item";

      div.innerHTML = `
        <img src="${item.url}" class="media-thumb">

        <input 
          type="text" 
          value="${item.url}" 
          readonly
        >
      `;

      grid.appendChild(div);

    });

  } catch (error) {

    console.error("Media load error:", error);

    grid.innerHTML = "<p>Failed to load media</p>";

  }

}