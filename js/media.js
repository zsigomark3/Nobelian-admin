/* =========================================
   Nobelian Backoffice - Media Manager
   
   Features:
   - Upload with folder & alt text
   - Folder filtering
   - Drag & drop reorder
   - Edit (rename, alt text, folder)
   - Optimize (resize, WebP conversion)
   
   Depends on: security.js, api.js, auth.js
========================================= */

let allMedia = [];
let allFolders = [];
let currentFolder = "";
let dragSrcEl = null;
let orderChanged = false;

document.addEventListener("DOMContentLoaded", () => {
  Auth.requireAuth();
  loadFolders().then(() => {
    loadMedia();
  });
  setupUpload();
  setupEditModal();
  setupOptimizeModal();
  setupFolderTabs();
});


/* =========================================
   Resolve media URL
   R2 URLs are already absolute (https://assets.nobelian.com/...)
   Legacy /cloud/ paths get prefixed with backend URL for backward compat
========================================= */

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Legacy fallback for old /cloud/ paths
  return API_BASE.replace("/api", "") + url;
}


/* =========================================
   Load Folders
========================================= */

async function loadFolders() {
  try {
    allFolders = await API.get("/media/folders");
  } catch (e) {
    console.error("Load folders error:", e);
    allFolders = [];
  }
  renderFolderTabs();
  populateFolderSelects();
}

function renderFolderTabs() {
  const container = document.getElementById("folderTabs");
  if (!container) return;
  container.innerHTML = "";
  allFolders.forEach(folder => {
    const btn = document.createElement("button");
    btn.className = "folder-tab";
    btn.dataset.folder = folder;
    btn.textContent = folder;
    container.appendChild(btn);
  });
  // Re-attach click handlers
  setupFolderTabs();
}

function populateFolderSelects() {
  const selects = [
    document.getElementById("uploadFolder"),
    document.getElementById("editFolder")
  ];
  selects.forEach(select => {
    if (!select) return;
    // Keep first option(s), remove dynamic ones
    const firstOptions = select.querySelectorAll("option");
    const keep = select.querySelector("option[value='']");
    select.innerHTML = "";
    if (keep) select.appendChild(keep);
    allFolders.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f;
      opt.textContent = f;
      select.appendChild(opt);
    });
  });
}


/* =========================================
   Folder Tab Filtering
========================================= */

function setupFolderTabs() {
  document.querySelectorAll(".folder-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".folder-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFolder = tab.dataset.folder;
      loadMedia();
    });
  });
}


/* =========================================
   Upload
========================================= */

function setupUpload() {
  const uploadBtn = document.getElementById("uploadButton");
  if (!uploadBtn) return;

  uploadBtn.addEventListener("click", async () => {
    const fileInput = document.getElementById("imageFile");
    const status = document.getElementById("uploadStatus");
    const folderSelect = document.getElementById("uploadFolder");
    const newFolderInput = document.getElementById("uploadNewFolder");
    const altInput = document.getElementById("uploadAltText");

    const files = fileInput.files;
    if (!files || files.length === 0) {
      alert("Please select one or more files");
      return;
    }

    const folder = newFolderInput.value.trim() || folderSelect.value;
    const altText = altInput.value.trim();

    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif",
      "image/webp", "image/svg+xml", "image/avif"
    ];

    const token = Auth.getToken();
    let uploaded = 0;
    let failed = 0;

    status.innerText = "Uploading...";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        failed++;
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        failed++;
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);
      if (altText) formData.append("alt_text", altText);

      try {
        const response = await fetch(`${API_BASE}/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (response.status === 401) {
          localStorage.removeItem("admin_token");
          window.location.href = "/login.html?reason=unauthorized";
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Upload failed");

        // If folder specified, update the media item
        if (folder) {
          await API.put(`/media/${encodeURIComponent(data.id)}`, { folder: folder });
        }

        uploaded++;
      } catch (err) {
        console.error("Upload error:", err);
        failed++;
      }
    }

    status.innerText = `Uploaded: ${uploaded}` + (failed > 0 ? `, Failed: ${failed}` : "");
    fileInput.value = "";
    altInput.value = "";
    newFolderInput.value = "";

    await loadFolders();
    loadMedia();
  });
}


/* =========================================
   Load & Render Media Grid
========================================= */

async function loadMedia() {
  const grid = document.getElementById("mediaGrid");
  if (!grid) return;

  grid.innerHTML = "<p>Loading images...</p>";

  try {
    let url = "/media";
    if (currentFolder) {
      url += `?folder=${encodeURIComponent(currentFolder)}`;
    }

    allMedia = await API.get(url);

    if (!allMedia || allMedia.length === 0) {
      grid.innerHTML = "<p>No media files found</p>";
      document.getElementById("saveOrderBtn").style.display = "none";
      return;
    }

    renderMediaGrid();

  } catch (error) {
    console.error("Media load error:", error);
    grid.innerHTML = "<p>Failed to load media</p>";
  }
}

function renderMediaGrid() {
  const grid = document.getElementById("mediaGrid");
  grid.innerHTML = "";

  allMedia.forEach((item, index) => {
    const fullUrl = resolveMediaUrl(item.url);
    const safeUrl = escapeAttr(fullUrl);
    const safeAlt = escapeAttr(item.alt_text || item.original_name || "");
    const safeId = escapeAttr(item.id);
    const safeName = escapeHtml(item.original_name || item.filename);
    const safeFolder = escapeHtml(item.folder || "");
    const sizeKB = (item.size / 1024).toFixed(1);

    const div = document.createElement("div");
    div.className = "media-item draggable";
    div.draggable = true;
    div.dataset.id = item.id;
    div.dataset.index = index;

    div.innerHTML = `
      <div class="media-drag-handle" title="Drag to reorder">⠿</div>
      <img src="${safeUrl}" class="media-thumb" alt="${safeAlt}" loading="lazy">
      <div class="media-item-info">
        <span class="media-item-name" title="${escapeAttr(item.original_name || '')}">${safeName}</span>
        <span class="media-item-meta">${escapeHtml(item.mime_type)} · ${sizeKB} KB</span>
        ${safeFolder ? `<span class="media-item-folder">${safeFolder}</span>` : ""}
      </div>
      <div class="media-item-actions">
        <button class="edit-btn media-edit-btn" data-id="${safeId}" title="Edit">✎</button>
        <button class="edit-btn media-optimize-btn" data-id="${safeId}" title="Optimize">⚡</button>
        <button class="delete-btn media-delete-btn" data-id="${safeId}" title="Delete">✕</button>
      </div>
      <input type="text" value="${safeUrl}" readonly onclick="this.select()" class="media-url-input" title="Click to copy URL">
    `;

    grid.appendChild(div);
  });

  attachMediaHandlers();
  setupDragAndDrop();
}


/* =========================================
   Event Handlers
========================================= */

function attachMediaHandlers() {
  // Delete
  document.querySelectorAll(".media-delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Delete this image?")) return;
      try {
        await API.delete(`/media/${encodeURIComponent(id)}`);
        loadMedia();
      } catch (err) {
        console.error("Delete media error:", err);
        alert("Failed to delete image");
      }
    });
  });

  // Edit
  document.querySelectorAll(".media-edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      openEditModal(id);
    });
  });

  // Optimize
  document.querySelectorAll(".media-optimize-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      openOptimizeModal(id);
    });
  });
}


/* =========================================
   Drag & Drop Reorder
========================================= */

function setupDragAndDrop() {
  const items = document.querySelectorAll(".media-item.draggable");

  items.forEach(item => {
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("dragenter", handleDragEnter);
    item.addEventListener("dragleave", handleDragLeave);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);
  });
}

function handleDragStart(e) {
  dragSrcEl = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.id);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDragEnter(e) {
  e.preventDefault();
  this.classList.add("drag-over");
}

function handleDragLeave() {
  this.classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove("drag-over");

  if (dragSrcEl === this) return;

  const grid = document.getElementById("mediaGrid");
  const allItems = Array.from(grid.querySelectorAll(".media-item"));
  const fromIndex = allItems.indexOf(dragSrcEl);
  const toIndex = allItems.indexOf(this);

  if (fromIndex < toIndex) {
    this.parentNode.insertBefore(dragSrcEl, this.nextSibling);
  } else {
    this.parentNode.insertBefore(dragSrcEl, this);
  }

  orderChanged = true;
  document.getElementById("saveOrderBtn").style.display = "inline-block";
}

function handleDragEnd() {
  this.classList.remove("dragging");
  document.querySelectorAll(".media-item").forEach(item => {
    item.classList.remove("drag-over");
  });
}

// Save order button
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveOrderBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveOrder);
  }
});

async function saveOrder() {
  const grid = document.getElementById("mediaGrid");
  const items = grid.querySelectorAll(".media-item");
  const reorderData = [];

  items.forEach((item, index) => {
    reorderData.push({
      id: item.dataset.id,
      sort_order: index
    });
  });

  try {
    await API.put("/media/reorder", { items: reorderData });
    orderChanged = false;
    document.getElementById("saveOrderBtn").style.display = "none";
    // Update local data
    allMedia = reorderData.map(r => allMedia.find(m => m.id === r.id)).filter(Boolean);
  } catch (err) {
    console.error("Reorder save error:", err);
    alert("Failed to save order");
  }
}


/* =========================================
   Edit Modal
========================================= */

function setupEditModal() {
  const form = document.getElementById("editForm");
  const cancelBtn = document.getElementById("editCancelBtn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveEdit();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeEditModal);
  }

  // Close on overlay click
  const overlay = document.getElementById("editModal");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeEditModal();
    });
  }
}

function openEditModal(id) {
  const item = allMedia.find(m => m.id === id);
  if (!item) return;

  document.getElementById("editId").value = id;
  document.getElementById("editName").value = item.original_name || "";
  document.getElementById("editAltText").value = item.alt_text || "";
  document.getElementById("editFolder").value = item.folder || "";
  document.getElementById("editNewFolder").value = "";
  document.getElementById("editPreview").src = resolveMediaUrl(item.url);

  // Populate folder select
  const select = document.getElementById("editFolder");
  select.innerHTML = '<option value="">No folder</option>';
  allFolders.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    if (f === item.folder) opt.selected = true;
    select.appendChild(opt);
  });

  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function saveEdit() {
  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const altText = document.getElementById("editAltText").value.trim();
  const folderSelect = document.getElementById("editFolder").value;
  const newFolder = document.getElementById("editNewFolder").value.trim();
  const folder = newFolder || folderSelect;

  const payload = {};
  if (name) payload.original_name = name;
  payload.alt_text = altText;
  payload.folder = folder;

  try {
    await API.put(`/media/${encodeURIComponent(id)}`, payload);
    closeEditModal();
    await loadFolders();
    loadMedia();
  } catch (err) {
    console.error("Edit save error:", err);
    alert("Failed to save: " + err.message);
  }
}


/* =========================================
   Optimize Modal
========================================= */

function setupOptimizeModal() {
  const form = document.getElementById("optimizeForm");
  const cancelBtn = document.getElementById("optimizeCancelBtn");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await runOptimize();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeOptimizeModal);
  }

  const overlay = document.getElementById("optimizeModal");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeOptimizeModal();
    });
  }
}

function openOptimizeModal(id) {
  const item = allMedia.find(m => m.id === id);
  if (!item) return;

  if (item.mime_type === "image/svg+xml") {
    alert("SVG files cannot be optimized (they are already vector-based).");
    return;
  }

  document.getElementById("optimizeId").value = id;
  document.getElementById("optimizePreview").src = resolveMediaUrl(item.url);
  document.getElementById("optimizeInfo").textContent =
    `${item.original_name} — ${item.mime_type} — ${(item.size / 1024).toFixed(1)} KB`;
  document.getElementById("optimizeWidth").value = 0;
  document.getElementById("optimizeHeight").value = 0;
  document.getElementById("optimizeQuality").value = 80;
  document.getElementById("optimizeFormat").value = "webp";
  document.getElementById("optimizeStatus").innerText = "";

  document.getElementById("optimizeModal").style.display = "flex";
}

function closeOptimizeModal() {
  document.getElementById("optimizeModal").style.display = "none";
}

async function runOptimize() {
  const id = document.getElementById("optimizeId").value;
  const format = document.getElementById("optimizeFormat").value;
  const width = parseInt(document.getElementById("optimizeWidth").value) || 0;
  const height = parseInt(document.getElementById("optimizeHeight").value) || 0;
  const quality = parseInt(document.getElementById("optimizeQuality").value) || 80;
  const status = document.getElementById("optimizeStatus");

  status.innerText = "Optimizing...";

  const payload = { format, quality };
  if (width > 0) payload.width = width;
  if (height > 0) payload.height = height;

  try {
    const result = await API.post(`/media/${encodeURIComponent(id)}/optimize`, payload);
    const newSize = (result.size / 1024).toFixed(1);
    status.innerText = `Done! New size: ${newSize} KB (${result.mime_type})`;

    // Refresh after a moment
    setTimeout(() => {
      closeOptimizeModal();
      loadMedia();
    }, 1500);
  } catch (err) {
    console.error("Optimize error:", err);
    status.innerText = "Optimization failed: " + err.message;
  }
}
