import apiClient from './axiosConfig';

// 문제 API
export const fetchProblems = async () => {
  const res = await apiClient.get('/problems');
  return res.data.data || res.data;
};

export const fetchProblemDetail = async (problemId) => {
  const res = await apiClient.get(`/problems/${problemId}`);
  return res.data.data || res.data;
};

export const createProblem = async (payload) => {
  const res = await apiClient.post('/problems', payload);
  return res.data.data || res.data;
};

export const updateProblem = async (problemId, payload) => {
  const res = await apiClient.put(`/problems/${problemId}`, payload);
  return res.data.data || res.data;
};

export const deleteProblem = async (problemId) => {
  const res = await apiClient.delete(`/problems/${problemId}`);
  return res.data.data || res.data;
};

export const addTestCase = async (problemId, payload) => {
  const res = await apiClient.post(`/problems/${problemId}/test-cases`, payload);
  return res.data.data || res.data;
};

// 세션 API
export const fetchSessions = async () => {
  const res = await apiClient.get('/sessions');
  return res.data.data || res.data;
};

export const createSession = async (payload) => {
  const res = await apiClient.post('/sessions', payload);
  return res.data.data || res.data;
};

export const updateSessionStatus = async (sessionId, status) => {
  const res = await apiClient.put(`/sessions/${sessionId}/status`, { status });
  return res.data.data || res.data;
};

export const resetSession = async (sessionId) => {
  const res = await apiClient.delete(`/sessions/${sessionId}/reset`);
  return res.data.data || res.data;
};

export const assignProblems = async (sessionId, problems) => {
  const res = await apiClient.post(`/sessions/${sessionId}/problems`, { problems });
  return res.data.data || res.data;
};

export const assignStudents = async (sessionId, studentIds) => {
  const res = await apiClient.post(`/sessions/${sessionId}/students`, { studentIds });
  return res.data.data || res.data;
};

export default {
  fetchProblems,
  fetchProblemDetail,
  createProblem,
  updateProblem,
  deleteProblem,
  addTestCase,
  fetchSessions,
  createSession,
  updateSessionStatus,
  resetSession,
  assignProblems,
  assignStudents,
};
