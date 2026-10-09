import api from './api';

export const materialService = {
  async list(projectId, params = {}) {
    const { data } = await api.get(`/projects/${projectId}/materials`, { params });
    return data.data; // { items, summary, pagination }
  },

  async get(projectId, materialId) {
    const { data } = await api.get(`/projects/${projectId}/materials/${materialId}`);
    return data.data.material;
  },

  async create(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/materials`, payload);
    return data.data.material;
  },

  async update(projectId, materialId, payload) {
    const { data } = await api.patch(`/projects/${projectId}/materials/${materialId}`, payload);
    return data.data.material;
  },

  async remove(projectId, materialId) {
    const { data } = await api.delete(`/projects/${projectId}/materials/${materialId}`);
    return data.data;
  },
};

export default materialService;
