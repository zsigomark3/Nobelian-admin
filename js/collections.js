/* =========================================
   Nobelian Backoffice - Collections Module
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  Auth.requireAuth();

  setupCreateCollection();
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
      <td colspan="2">Loading collections...</td>
    </tr>
  `;

  try {

    const collections = await API.get("/collections");

    if (!collections || collections.length === 0) {

      table.innerHTML = `
        <tr>
          <td colspan="2">No collections found</td>
        </tr>
      `;

      return;

    }

    table.innerHTML = "";

    collections.forEach(collection => {

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${collection.name}</td>

        <td>

          <button class="delete-btn" data-id="${collection.id}">
            Delete
          </button>

        </td>
      `;

      table.appendChild(row);

    });

    attachDeleteHandlers();

  } catch (error) {

    console.error("Collections load error:", error);

    table.innerHTML = `
      <tr>
        <td colspan="2">Failed to load collections</td>
      </tr>
    `;

  }

}


/* =========================================
   Create Collection
========================================= */

function setupCreateCollection() {

  const createBtn = document.getElementById("createCollectionButton");

  if (!createBtn) return;

  createBtn.addEventListener("click", async () => {

    const input = document.getElementById("collectionName");

    const name = input.value.trim();

    if (!name) {
      alert("Enter collection name");
      return;
    }

    try {

      await API.post("/collections", {
        name: name
      });

      input.value = "";

      loadCollections();

    } catch (error) {

      console.error("Create collection error:", error);

      alert("Failed to create collection");

    }

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

        await API.delete(`/collections/${id}`);

        loadCollections();

      } catch (error) {

        console.error("Delete collection error:", error);

        alert("Failed to delete collection");

      }

    });

  });

}