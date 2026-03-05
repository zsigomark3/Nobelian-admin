/* =========================================
   Nobelian Backoffice - Global App Module
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeAdmin();

});


/* =========================================
   Initialize Admin
========================================= */

function initializeAdmin() {

  if (typeof Auth !== "undefined") {
    Auth.requireAuth();
  }

  setupLogout();
  highlightActiveNav();
  loadDashboardStats();

}


/* =========================================
   Logout
========================================= */

function setupLogout() {

  const logoutBtn = document.getElementById("logoutButton");

  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {

    if (typeof Auth !== "undefined") {
      Auth.logout();
    } else {
      localStorage.removeItem("admin_token");
      window.location.href = "/login.html";
    }

  });

}


/* =========================================
   Highlight Active Navigation
========================================= */

function highlightActiveNav() {

  const links = document.querySelectorAll(".nav-item");

  const currentPath = window.location.pathname;

  links.forEach(link => {

    const href = link.getAttribute("href");

    if (!href) return;

    if (currentPath.includes(href)) {

      link.classList.add("active");

    }

  });

}


/* =========================================
   Dashboard Stats
========================================= */

async function loadDashboardStats() {

  const productsEl = document.getElementById("totalProducts");
  const collectionsEl = document.getElementById("totalCollections");

  if (!productsEl && !collectionsEl) return;

  try {

    if (productsEl) {

      const products = await API.get("/products");

      productsEl.innerText = products.length;

    }

    if (collectionsEl) {

      const collections = await API.get("/collections");

      collectionsEl.innerText = collections.length;

    }

  } catch (error) {

    console.error("Dashboard stats error:", error);

  }

}


/* =========================================
   Global Notifications (future feature)
========================================= */

function showNotification(message, type = "info") {

  console.log(`[${type}]`, message);

  // future UI toast notifications

}