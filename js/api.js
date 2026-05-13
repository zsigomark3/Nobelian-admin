/* =========================================
   Nobelian Backoffice API Helper
   
   Depends on: security.js (escapeHtml, TokenUtils)
========================================= */

const API_BASE = "https://nobelian-be.fly.dev/api";



const API = {

  async request(endpoint, options = {}) {

    const token = localStorage.getItem("admin_token");

    // Pre-flight: check token expiry before making request
    if (token && TokenUtils.isExpired(token)) {
      localStorage.removeItem("admin_token");
      window.location.href = "/login.html?reason=expired";
      throw new Error("Token expired");
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options
    };

    try {

      const response = await fetch(`${API_BASE}${endpoint}`, config);

      // Handle 401 - token rejected by server
      if (response.status === 401) {
        localStorage.removeItem("admin_token");
        window.location.href = "/login.html?reason=unauthorized";
        throw new Error("Unauthorized");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "API Error");
      }

      return data;

    } catch (error) {

      console.error("API request error:", error);

      throw error;

    }

  },



  /* ===============================
     GET
  =============================== */

  async get(endpoint) {

    return this.request(endpoint, {
      method: "GET"
    });

  },



  /* ===============================
     POST
  =============================== */

  async post(endpoint, body) {

    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body)
    });

  },



  /* ===============================
     PUT
  =============================== */

  async put(endpoint, body) {

    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body)
    });

  },



  /* ===============================
     DELETE
  =============================== */

  async delete(endpoint) {

    return this.request(endpoint, {
      method: "DELETE"
    });

  }

};
