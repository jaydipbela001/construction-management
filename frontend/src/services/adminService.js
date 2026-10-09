import api from './api';

export const adminService = {
  async list() {
    const { data } = await api.get('/admins');
    return data.data.items; // [{ id, email, name, createdAt, updatedAt }]
  },

  async create(payload) {
    const { data } = await api.post('/admins', payload);
    return data.data.admin;
  },
};

export default adminService;
