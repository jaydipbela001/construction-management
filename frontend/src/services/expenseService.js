import api from './api';

export const expenseService = {
  async list(projectId, params = {}) {
    const { data } = await api.get(`/projects/${projectId}/expenses`, { params });
    return data.data; // { items, summary, pagination }
  },

  async get(projectId, expenseId) {
    const { data } = await api.get(`/projects/${projectId}/expenses/${expenseId}`);
    return data.data.expense;
  },

  async create(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/expenses`, payload);
    return data.data.expense;
  },

  async update(projectId, expenseId, payload) {
    const { data } = await api.patch(`/projects/${projectId}/expenses/${expenseId}`, payload);
    return data.data.expense;
  },

  async remove(projectId, expenseId) {
    const { data } = await api.delete(`/projects/${projectId}/expenses/${expenseId}`);
    return data.data;
  },
};

export default expenseService;
