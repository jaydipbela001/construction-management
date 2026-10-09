import api from './api';

export const projectService = {
  async list(params = {}) {
    const { data } = await api.get('/projects', { params });
    return data.data; // { items, pagination }
  },

  async get(projectId) {
    const { data } = await api.get(`/projects/${projectId}`);
    return data.data; // { project, totals }
  },

  async create(payload) {
    const { data } = await api.post('/projects', payload);
    return data.data.project;
  },

  async update(projectId, payload) {
    const { data } = await api.patch(`/projects/${projectId}`, payload);
    return data.data.project;
  },

  async remove(projectId) {
    const { data } = await api.delete(`/projects/${projectId}`);
    return data.data;
  },
};

export default projectService;
