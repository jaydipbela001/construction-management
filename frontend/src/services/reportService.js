import api from './api';

// Reports are downloaded as CSV files triggered by the browser, so the auth
// token flows through the axios instance (Authorize header) rather than a raw
// <a href>, which cannot send headers.

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function contentDispositionFilename(value) {
  const match = /filename="?([^";]+)"?/.exec(value || '');
  return match ? match[1] : undefined;
}

async function download(url, fallbackName) {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = response.data;
  const filename =
    contentDispositionFilename(response.headers?.['content-disposition']) || fallbackName;
  triggerDownload(blob, filename);
}

export const reportService = {
  async getProjectReport(projectId) {
    const { data } = await api.get(`/projects/${projectId}/report`);
    return data.data; // { project, totals, materials, expenses }
  },

  exportDashboard() {
    return download('/dashboard/export', 'buildtrack-dashboard.csv');
  },

  exportProjectMaterials(projectId) {
    return download(`/projects/${projectId}/export/materials`, 'project-materials.csv');
  },

  exportProjectExpenses(projectId) {
    return download(`/projects/${projectId}/export/expenses`, 'project-expenses.csv');
  },

  exportProjectSummary(projectId) {
    return download(`/projects/${projectId}/export/summary`, 'project-summary.csv');
  },
};

export default reportService;