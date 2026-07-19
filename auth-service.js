/**
 * ==========================================================
 * FRONTEND SERVICE: auth-service.js
 * Peran     : Hashing password & Multi-Role Session Manager
 * Status    : PRODUCTION UPGRADE - Student Dynamic Dropdown
 * ==========================================================
 */

const AUTH_SERVICE = {
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbxE_OIRpPdaAR91bwa3fT8myIKytHZF8P0_PH5ikF-9fqjAJqoi4NaLpKdHtn7o9V5zEA/exec",
  SESSION_KEY: "cbt_session",

  /**
   * Fungsi Login Multi-Role Terintegrasi Cloud Backend (Admin/Guru/Staff)
   */
  async login(username, password) {
    try {
      const passwordHash = await this._hashPassword(password);
      const payload = {
        action: "login",
        payload: {
          username: username.trim(),
          password_hash: passwordHash
        }
      };

      const response = await fetch(this.GAS_API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" }, 
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.status === "SUCCESS") {
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
   * NEW FEATURE: Log masuk instan siswa via seleksi paket dropdown lokal
   * @param {string} namaSiswa 
   * @param {string|number} kelasSiswa 
   */
  studentDirectLogin(namaSiswa, kelasSiswa) {
    const cleanUsername = namaSiswa.toLowerCase().replace(/[^a-z0-9]/g, "");
    const uniqueUid = `siswa-${cleanUsername}-${Date.now().toString().slice(-5)}`;
    
    const studentSession = {
      uid: uniqueUid,
      username: uniqueUid,
      nama: namaSiswa,
      kelas: kelasSiswa,
      role: "SISWA"
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(studentSession));
    return studentSession;
  },

  /**
   * Cek status session di halaman dashboard/exam dengan proteksi ketat
   */
  checkSession(allowedRoles = []) {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) {
      this.logout();
      return null;
    }

    const session = JSON.parse(sessionStr);
    
    if (!session || !session.role) {
      this.logout();
      return null;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      alert(`Akses Ditolak! Akun Anda (${session.role}) tidak memiliki hak akses ke halaman ini.`);
      if (session.role === 'SISWA') {
        window.location.href = "login.html";
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
   * Helper SHA-256 Hashing menggunakan Web Crypto API
   */
  async _hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
};
