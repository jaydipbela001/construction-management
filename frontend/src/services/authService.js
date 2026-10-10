import api, { clearToken, setToken } from './api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    const payload = data.data;
    setToken(payload.token);
    return payload.admin;
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data.data.admin;
  },

  async updateProfile(payload) {
    const { data } = await api.patch('/auth/profile', payload);
    return data.data.admin;
  },

  async changePassword(payload) {
    const { data } = await api.post('/auth/change-password', payload);
    return data.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* logout is best-effort; the token is stateless */
    }
    clearToken();
  },
};

export default authService;
