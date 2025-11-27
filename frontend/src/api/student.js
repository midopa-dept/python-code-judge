import apiClient from './axiosConfig';

export const getProblems = async (params = {}) => {
  // 빈 문자열인 파라미터 제거 (validator 에러 방지)
  const cleanParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      cleanParams[key] = params[key];
    }
  });

  const response = await apiClient.get('/problems', { params: cleanParams });
  // 백엔드 응답: { success: true, data: { problems, pagination } }
  return response.data.data || response.data;
};

export const getProblemDetail = async (problemId) => {
  const response = await apiClient.get(`/problems/${problemId}`);
  return response.data.data || response.data;
};

export const submitCode = async ({ problemId, code, pythonVersion }) => {
  const response = await apiClient.post('/submissions', {
    problemId,
    code,
    pythonVersion,
  });
  return response.data.data || response.data;
};

export const getSubmissions = async (params = {}) => {
  // 빈 문자열인 파라미터 제거 (validator 에러 방지)
  const cleanParams = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
      cleanParams[key] = params[key];
    }
  });

  const response = await apiClient.get('/submissions', { params: cleanParams });
  return response.data.data || response.data;
};

export const getSubmissionResult = async (submissionId) => {
  const response = await apiClient.get(`/submissions/${submissionId}`);
  return response.data.data || response.data;
};

export const getScoreboard = async (sessionId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/scoreboard`);
  return response.data.data || response.data;
};

export const getMyScoreboard = async () => {
  const response = await apiClient.get('/sessions/scoreboard');
  return response.data.data || response.data;
};

export default {
  getProblems,
  getProblemDetail,
  submitCode,
  getSubmissions,
  getSubmissionResult,
  getScoreboard,
  getMyScoreboard,
};
