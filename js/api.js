/* =========================================
   Nobelian Backoffice API Helper
========================================= */

const API_BASE = "https://api.nobelian.com";



const API = {

  async request(endpoint, options = {}) {

    const token = localStorage.getItem("admin_token");

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options
    };

    try {

      const response = await fetch(`${API_BASE}${endpoint}`, config);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API Error");
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