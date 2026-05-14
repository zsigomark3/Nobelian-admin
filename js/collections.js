/* =========================================
   Nobelian Backoffice - Collections Module
   
   Depends on: security.js, api.js, auth.js
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  Auth.requireAuth();

  setupCollectionForm();
  loadCollections();

});


/* =========================================
   Load Collections
========================================= */

async function loadCollections() {

  const table = document.getElementById("collectionsTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="4">Loading collections...</td>
    </tr>
  `;

  try {

    const collections = await API.get("/collections");

    if (!collections || collections.length === 0) {

      table.innerHTML = `
        <tr>
          <td colspan="4">No collections found</td>
        </tr>
      `;

      return;

    }

    table.innerHTML = "";

    collections.forEach(collection => {

      const row = document.createElement("tr");

      const safeName = escapeHtml(collection.name);
      const safeSlug = escapeHtml(collection.slug || "");
      const safeId = escapeAttr(collection.id);
      const featuredLabel = collection.featured ? "Yes" : "No";

      row.innerHTML = `
        <td>${safeName}</td>
        <td><code>${safeSlug}</code></td>
        <td>${featuredLabel}</td>
        <td>
          <button class="edit-btn" data-id="${safeId}">Edit</button>
          <button class="delete-btn" data-id="${safeId}">Delete</button>
        </td>
      `;

      table.appendChild(row);

    });

    attachEditHandlers(collections);
    attachDeleteHandlers();

  } catch (error) {

    console.error("Collections load error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="4">Failed to load collections</td>
      </tr>
    `;

  }

}


/* =========================================
   Setup Collection Form (Create + Edit)
========================================= */

function setupCollectionForm() {

  const createBtn = document.getElementById("createCollectionButton");
  const cancelBtn = document.getElementById("cancelEditButton");

  if (!createBtn) return;

  createBtn.addEventListener("click", async () => {

    const editId = document.getElementById("editCollectionId").value;

    const name = document.getElementById("collectionName").value.trim();
    const slug = document.getElementById("collectionSlug").value.trim();
    const description = document.getElementById("collectionDescription").value.trim();
    const coverImage = document.getElementById("collectionCoverImage").value.trim();
    const featured = document.getElementById("collectionFeatured").checked;

    if (!name) {
      alert("Enter collection name");
      return;
    }

    if (name.length > 100) {
      alert("Collection name must be 100 characters or less");
      return;
    }

    // Validate slug format if provided
    if (slug && !/^[a-z0-9\-]+$/.test(slug)) {
      alert("Slug must contain only lowercase letters, numbers, and hyphens");
      return;
    }

    const payload = { name, featured };
    if (slug) payload.slug = slug;
    if (description) payload.description = description;
    if (coverImage) payload.cover_image = coverImage;

    try {

      if (editId) {
        // Update existing collection
        await API.put(`/collections/${encodeURIComponent(editId)}`, payload);
      } else {
        // Create new collection
        await API.post("/collections", payload);
      }

      resetForm();
      loadCollections();

    } catch (error) {

      console.error("Save collection error:", error);
      alert(editId ? "Failed to update collection" : "Failed to create collection");

    }

  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      resetForm();
    });
  }

}


/* =========================================
   Edit Collection — populate form
========================================= */

function attachEditHandlers(collections) {

  const buttons = document.querySelectorAll(".edit-btn");

  buttons.forEach(button => {

    button.addEventListener("click", () => {

      const id = button.dataset.id;
      const collection = collections.find(c => c.id === id);

      if (!collection) return;

      // Populate form fields
      document.getElementById("collectionName").value = collection.name || "";
      document.getElementById("collectionSlug").value = collection.slug || "";
      document.getElementById("collectionDescription").value = collection.description || "";
      document.getElementById("collectionCoverImage").value = collection.cover_image || "";
      document.getElementById("collectionFeatured").checked = collection.featured || false;

      // Switch to edit mode
      document.getElementById("editCollectionId").value = id;
      document.getElementById("collectionFormTitle").textContent = "Edit Collection";
      document.getElementById("createCollectionButton").textContent = "Save Changes";
      document.getElementById("cancelEditButton").style.display = "inline-block";

      // Scroll to form
      document.getElementById("collectionFormTitle").scrollIntoView({ behavior: "smooth" });

    });

  });

}


/* =========================================
   Delete Collection
========================================= */

function attachDeleteHandlers() {

  const buttons = document.querySelectorAll(".delete-btn");

  buttons.forEach(button => {

    button.addEventListener("click", async () => {

      const id = button.dataset.id;

      const confirmDelete = confirm("Delete this collection?");

      if (!confirmDelete) return;

      try {

        await API.delete(`/collections/${encodeURIComponent(id)}`);

        loadCollections();

      } catch (error) {

        console.error("Delete collection error:", error);

        alert("Failed to delete collection");

      }

    });

  });

}


/* =========================================
   Reset Form to Create mode
========================================= */

function resetForm() {

  document.getElementById("collectionName").value = "";
  document.getElementById("collectionSlug").value = "";
  document.getElementById("collectionDescription").value = "";
  document.getElementById("collectionCoverImage").value = "";
  document.getElementById("collectionFeatured").checked = false;
  document.getElementById("editCollectionId").value = "";
  document.getElementById("collectionFormTitle").textContent = "Create Collection";
  document.getElementById("createCollectionButton").textContent = "Create";
  document.getElementById("cancelEditButton").style.display = "none";

}
