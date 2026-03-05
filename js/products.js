/* =========================================
   Nobelian Backoffice - Products Module
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  Auth.requireAuth();

  loadProducts();

});



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

      row.innerHTML = `
        <td>
          <img src="${product.image || ''}" class="product-thumb">
        </td>

        <td>
          ${product.name}
        </td>

        <td>
          € ${product.price}
        </td>

        <td>
          ${product.collection || "-"}
        </td>

        <td>

          <a href="/product-edit.html?id=${product.id}" class="edit-btn">
            Edit
          </a>

          <button class="delete-btn" data-id="${product.id}">
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

        await API.delete(`/products/${id}`);

        loadProducts();

      } catch (error) {

        console.error("Delete failed:", error);

        alert("Failed to delete product");

      }

    });

  });

}