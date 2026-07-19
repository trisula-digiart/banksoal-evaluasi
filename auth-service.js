/**
 * ==========================================================
 * FRONTEND SERVICE: auth-service.js
 * Peran     : Hashing password & Multi-Role Session Manager
 * Status    : PATCHED FULL - Version 4.0 Production Ready
 * ==========================================================
 */

const AUTH_SERVICE = {
  // URL Web App Google Apps Script Utama yang sudah terintegrasi analitik
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbxE_OIRpPdaAR91bwa3fT8myIKytHZF8P0_PH5ikF-9fqjAJqoi4NaLpKdHtn7o9V5zEA/exec",
  SESSION_KEY: "cbt_session",

  /**
   * Fungsi Login Multi-Role Terintegrasi Cloud Backend
   * @param {string} username 
   * @param {string} password 
   */
  async login(username, password) {
    try {
      // 1. Hash password di client-side menggunakan Web Crypto API
      const passwordHash = await this._hashPassword(password);

      // 2. Siapkan payload request sesuai standarisasi router GAS
      const payload = {
        action: "login",
        payload: {
          username: username.trim(),
          password_hash: passwordHash
        }
      };

      // 3. Tembak ke Apps Script Engine
      const response = await fetch(this.GAS_API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" }, 
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.status === "SUCCESS") {
        // 4. Simpan session di localStorage menggunakan key lowercase agar singkron dengan index.html
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(result.data));
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
   * Cek status session di halaman dashboard/exam dengan proteksi ketat
   * @param {Array} allowedRoles - Role yang diijinkan masuk (e.g. ['ADMIN', 'GURU'] atau ['SISWA'])
   */
  checkSession(allowedRoles = []) {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) {
      this.logout();
      return null;
    }

    const session = JSON.parse(sessionStr);
    
    // Validasi format objek session internal
    if (!session || !session.role) {
      this.logout();
      return null;
    }
    
    // Validasi pemisahan role management (Mencegah salah masuk kamar halaman)
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      alert(`Akses Ditolak! Akun Anda (${session.role}) tidak memiliki hak akses ke halaman ini.`);
      
      // Smart Router Direction
      if (session.role === 'SISWA') {
        window.location.href = "siswa-exam.html";
      } else {
        window.location.href = "index.html";
      }
      return null;
    }

    return session;
  },

  /**
   * Clear session dan tendang kembali ke halaman login utama
   */
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
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
