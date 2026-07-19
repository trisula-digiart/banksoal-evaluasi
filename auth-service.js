/**
 * ==========================================
 * FRONTEND SERVICE: auth-service.js
 * Peran     : Hashing password & session manager
 * ==========================================
 */

const AUTH_SERVICE = {
  // Ganti dengan URL Web App Google Apps Script lu yang sudah di-deploy
  GAS_API_URL: "https://script.google.com/macros/s/YOUR_GAS_DEPLOYMENT_ID/exec",

  /**
   * Fungsi Login Multi-Role
   * @param {string} username 
   * @param {string} password 
   */
  async login(username, password) {
    try {
      // 1. Hash password di client-side biar gak telanjang pas lewat jaringan
      const passwordHash = await this._hashPassword(password);

      // 2. Siapkan payload request
      const payload = {
        action: "login",
        payload: {
          username: username.trim(),
          password_hash: passwordHash
        }
      };

      // 3. Tembak ke Apps Script
      const response = await fetch(this.GAS_API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" }, // GAS butuh text/plain biar gak kena CORS preflight
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.status === "SUCCESS") {
        // 4. Simpan session aman di sessionStorage
        sessionStorage.setItem("CBT_SESSION", JSON.stringify(result.data));
        return { success: true, user: result.data };
      } else {
        return { success: false, message: result.error };
      }
    } catch (error) {
      console.error("Auth Error:", error);
      return { success: false, message: "Gagal terhubung ke server backend!" };
    }
  },

  /**
   * Cek status session di halaman dashboard/exam
   * @param {Array} allowedRoles - Role yang diijinkan masuk (e.g. ['ADMIN', 'GURU'])
   */
  checkSession(allowedRoles = []) {
    const sessionStr = sessionStorage.getItem("CBT_SESSION");
    if (!sessionStr) {
      this.logout();
      return null;
    }

    const session = JSON.parse(sessionStr);
    
    // Validasi role management
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      alert("Lu gak punya hak akses ke halaman ini, bro!");
      this.logout();
      return null;
    }

    return session;
  },

  /**
   * Clear session dan tendang ke halaman login
   */
  logout() {
    sessionStorage.removeItem("CBT_SESSION");
    window.location.href = "login.html";
  },

  /**
   * Helper SHA-256 Hashing menggunakan Web Crypto API (Native Browser)
   */
  async _hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
};
