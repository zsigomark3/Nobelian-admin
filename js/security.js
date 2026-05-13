/* =========================================
   Nobelian Backoffice - Security Utilities
   
   This module MUST be loaded before all other
   JS modules (first script tag in HTML).
========================================= */


/* =========================================
   XSS Prevention - HTML Escape
   
   Always use escapeHtml() when inserting
   user-controlled or API data into innerHTML.
========================================= */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================
   XSS Prevention - Attribute Escape
   
   Use for inserting data into HTML attributes.
========================================= */

function escapeAttr(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


/* =========================================
   JWT Token Utilities
   
   Decode JWT payload without verification
   (verification happens server-side).
   Used for client-side expiry checks and
   role validation.
========================================= */

const TokenUtils = {

  /**
   * Decode JWT payload (base64url -> JSON)
   * Returns null if token is malformed.
   */
  decode(token) {
    try {
      if (!token || typeof token !== "string") return null;

      const parts = token.split(".");
      if (parts.length !== 3) return null;

      // base64url -> base64
      let payload = parts[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      // Pad if needed
      const pad = payload.length % 4;
      if (pad) {
        payload += "=".repeat(4 - pad);
      }

      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if token is expired.
   * Returns true if expired or invalid.
   */
  isExpired(token) {
    const payload = this.decode(token);
    if (!payload || !payload.exp) return true;

    // exp is in seconds, Date.now() is in milliseconds
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  },

  /**
   * Check if token has admin role.
   */
  isAdmin(token) {
    const payload = this.decode(token);
    if (!payload) return false;
    return payload.role === "admin";
  },

  /**
   * Get remaining time in minutes.
   * Returns 0 if expired.
   */
  remainingMinutes(token) {
    const payload = this.decode(token);
    if (!payload || !payload.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    const remaining = payload.exp - now;
    return remaining > 0 ? Math.floor(remaining / 60) : 0;
  }

};


/* =========================================
   Session Idle Timeout
   
   Logs out the user after 30 minutes of
   inactivity (no mouse/keyboard/touch).
========================================= */

const SessionTimeout = {

  IDLE_LIMIT_MS: 30 * 60 * 1000, // 30 minutes
  WARNING_BEFORE_MS: 2 * 60 * 1000, // Warn 2 minutes before
  _timer: null,
  _warningTimer: null,
  _active: false,

  start() {
    if (this._active) return;
    this._active = true;

    this._resetTimer();

    // Track user activity
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(event => {
      document.addEventListener(event, () => this._resetTimer(), { passive: true });
    });
  },

  stop() {
    this._active = false;
    if (this._timer) clearTimeout(this._timer);
    if (this._warningTimer) clearTimeout(this._warningTimer);
  },

  _resetTimer() {
    if (this._timer) clearTimeout(this._timer);
    if (this._warningTimer) clearTimeout(this._warningTimer);

    // Set warning timer
    this._warningTimer = setTimeout(() => {
      this._showWarning();
    }, this.IDLE_LIMIT_MS - this.WARNING_BEFORE_MS);

    // Set logout timer
    this._timer = setTimeout(() => {
      this._onTimeout();
    }, this.IDLE_LIMIT_MS);
  },

  _showWarning() {
    // Create a non-intrusive warning banner
    let banner = document.getElementById("session-timeout-warning");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "session-timeout-warning";
      banner.style.cssText = "position:fixed;top:0;left:0;right:0;background:#c0392b;color:white;padding:10px;text-align:center;z-index:99999;font-size:14px;";
      banner.innerHTML = "Your session will expire in 2 minutes due to inactivity. Move your mouse to stay logged in.";
      document.body.appendChild(banner);
    }

    // Remove warning on activity
    const removeWarning = () => {
      if (banner && banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
      document.removeEventListener("mousedown", removeWarning);
      document.removeEventListener("keydown", removeWarning);
    };
    document.addEventListener("mousedown", removeWarning, { once: true });
    document.addEventListener("keydown", removeWarning, { once: true });
  },

  _onTimeout() {
    // Clear token and redirect
    localStorage.removeItem("admin_token");
    window.location.href = "/login.html?reason=timeout";
  }

};
