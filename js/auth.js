/* =========================================
   Nobelian Backoffice Authentication
   
   Depends on: security.js (TokenUtils, SessionTimeout)
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

  /**
   * Validates that the stored token:
   * 1. Exists
   * 2. Is a valid JWT structure (3 parts)
   * 3. Is not expired
   * 4. Has admin role
   * 
   * If any check fails, redirects to login.
   */
  requireAuth() {

    const token = this.getToken();

    if (!token) {
      window.location.href = "/login.html";
      return;
    }

    // Validate token structure and expiry
    if (TokenUtils.isExpired(token)) {
      this.removeToken();
      window.location.href = "/login.html?reason=expired";
      return;
    }

    // Validate admin role
    if (!TokenUtils.isAdmin(token)) {
      this.removeToken();
      window.location.href = "/login.html?reason=unauthorized";
      return;
    }

    // Start idle session timeout
    SessionTimeout.start();

    // Periodically check token expiry (every 60 seconds)
    this._startExpiryCheck();

  },

  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;
    if (TokenUtils.isExpired(token)) {
      this.removeToken();
      return false;
    }
    return TokenUtils.isAdmin(token);
  },

  logout() {

    SessionTimeout.stop();
    this.removeToken();
    window.location.href = "/login.html";

  },

  getAuthHeader() {

    const token = this.getToken();

    if (!token) return {};

    // Check expiry before returning header
    if (TokenUtils.isExpired(token)) {
      this.removeToken();
      window.location.href = "/login.html?reason=expired";
      return {};
    }

    return {
      Authorization: `Bearer ${token}`
    };

  },

  /**
   * Periodically check if token has expired while user is active.
   * This catches the case where the 7-day token expires mid-session.
   */
  _startExpiryCheck() {
    setInterval(() => {
      const token = this.getToken();
      if (!token || TokenUtils.isExpired(token)) {
        SessionTimeout.stop();
        this.removeToken();
        window.location.href = "/login.html?reason=expired";
      }
    }, 60 * 1000); // Check every minute
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
