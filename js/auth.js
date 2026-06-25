// Servicio de Autenticación
const AuthService = {
  // Dynamic API URL: use localhost for dev, your deployed backend for production
  // For Netlify, set this to your Render/Railway backend URL (e.g., https://tu-backend.onrender.com/api)
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://TU-BACKEND.onrender.com/api',

  // Obtener storage según preferencia (priorizar sessionStorage para aislamiento por pestaña)
  getStorage() {
    // Intentar usar sessionStorage primero (per pestaña)
    try {
      if (sessionStorage.getItem('token')) {
        return sessionStorage;
      }
    } catch (e) {
      // Fallback a localStorage
    }
    return localStorage;
  },

  // Obtener token
  getToken() {
    const storage = this.getStorage();
    return storage.getItem('token');
  },

  // Obtener usuario
  getUser() {
    const storage = this.getStorage();
    const user = storage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Verificar si está autenticado
  isAuthenticated() {
    return !!this.getToken();
  },

  // Verificar rol
  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  },

  // Verificar si es dueño (admin)
  isAdmin() {
    return this.hasRole('dueño');
  },

  // Guardar sesión
  setSession(token, user, useSession = true) {
    const storage = useSession ? sessionStorage : localStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
  },

  // Cerrar sesión
  logout() {
    // Limpiar ambos storages para estar seguro
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },

  // Verificar autenticación y redirigir si no está logueado
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  // Verificar rol de admin y redirigir si no tiene permiso
  requireAdmin() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    if (!this.isAdmin()) {
      alert('No tienes permisos para acceder a esta página');
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  // Hacer request autenticado
  async authenticatedFetch(url, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      this.logout();
      return null;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    try {
      const response = await fetch(`${this.API_URL}${url}`, {
        ...options,
        headers
      });

      // Si el token expiró (401)
      if (response.status === 401) {
        this.logout();
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error en request autenticado:', error);
      return null;
    }
  },

  // Login
  async login(email, password, rememberMe = false) {
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        // Si rememberMe es true, usar localStorage para persitencia
        this.setSession(data.token, data.user, !rememberMe);
        return { success: true, user: data.user };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error al conectar con el servidor' };
    }
  },

  // Registro
  async register(name, email, password, companyName, companyNit, fiscalInfo = {}) {
    try {
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role: 'dueño',
          companyName,
          companyNit,
          fiscalInfo 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Usar sessionStorage por defecto para registro
        this.setSession(data.token, data.user, true);
        return { success: true, user: data.user };
      }
      
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, message: 'Error al conectar con el servidor' };
    }
  }
};

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
