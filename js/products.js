/* =========================================
   Nobelian Backoffice - Products Module
   
   Depends on: security.js, api.js, auth.js
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  Auth.requireAuth();

  loadProducts();

});


/* =========================================
   Resolve media URL (relative -> absolute)
========================================= */

function resolveProductImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return API_BASE.replace("/api", "") + url;
}


/* =========================================
   Load Products
========================================= */

async function loadProducts() {

  const tableBody = document.getElementById("productsTableBody");

  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="5">Loading products...</td>
    </tr>
  `;

  try {

    const products = await API.get("/products");

    if (!products || products.length === 0) {

      tableBody.innerHTML = `
        <tr>
          <td colspan="5">No products found</td>
        </tr>
      `;

      return;

    }

    tableBody.innerHTML = "";

    products.forEach(product => {

      const row = document.createElement("tr");

      const imageUrl = product.images && product.images[0]
        ? resolveProductImageUrl(product.images[0])
        : "";

      const safeName = escapeHtml(product.name);
      const safeCategory = escapeHtml(product.category || "-");
      const safeId = escapeAttr(product.id);
      const safeImageUrl = escapeAttr(imageUrl);

      row.innerHTML = `
        <td>
          ${imageUrl ? `<img src="${safeImageUrl}" class="product-thumb" alt="${safeName}">` : "-"}
        </td>

        <td>${safeName}</td>

        <td>€ ${escapeHtml(String(product.price))}</td>

        <td>${safeCategory}</td>

        <td>
          <a href="/product-edit.html?id=${safeId}" class="edit-btn">
            Edit
          </a>

          <button class="delete-btn" data-id="${safeId}">
            Delete
          </button>
        </td>
      `;

      tableBody.appendChild(row);

    });


    attachDeleteHandlers();

  } catch (error) {

    console.error("Failed to load products:", error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="5">Error loading products</td>
      </tr>
    `;

  }

}



/* =========================================
   Attach Delete Button Handlers
========================================= */

function attachDeleteHandlers() {

  const buttons = document.querySelectorAll(".delete-btn");

  buttons.forEach(button => {

    button.addEventListener("click", async () => {

      const id = button.dataset.id;

      const confirmDelete = confirm("Delete this product?");

      if (!confirmDelete) return;

      try {

        await API.delete(`/products/${encodeURIComponent(id)}`);

        loadProducts();

      } catch (error) {

        console.error("Delete failed:", error);

        alert("Failed to delete product");

      }

    });

  });

}
