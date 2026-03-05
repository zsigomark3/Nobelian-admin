/* =========================================
   Nobelian Backoffice Authentication
========================================= */

const Auth = {

  getToken() {
    return localStorage.getItem("admin_token");
  },

  setToken(token) {
    localStorage.setItem("admin_token", token);
  },

  removeToken() {
    localStorage.removeItem("admin_token");
  },

  isLoggedIn() {
    const token = this.getToken();
    return !!token;
  },

  requireAuth() {

    const token = this.getToken();

    if (!token) {
      window.location.href = "/login.html";
    }

  },

  logout() {

    this.removeToken();
    window.location.href = "/login.html";

  },

  getAuthHeader() {

    const token = this.getToken();

    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`
    };

  }

};



/* =========================================
   Auto attach logout button
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  const logoutBtn = document.getElementById("logoutButton");

  if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {
      Auth.logout();
    });

  }

});