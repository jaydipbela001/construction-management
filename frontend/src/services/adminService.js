import api from './api';

export const adminService = {
  async list() {
    const { data } = await api.get('/admins');
    return data.data.items; // [{ id, email, name, createdAt, updatedAt, role }]
  },

  async create(payload) {
    const { data } = await api.post('/admins', payload);
    return data.data.admin;
  },

  async remove(id) {
    const { data } = await api.delete(`/admins/${id}`);
    return data.data;
  },
};

export default adminService;
