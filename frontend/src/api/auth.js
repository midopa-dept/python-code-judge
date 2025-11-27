import apiClient from '../api/axiosConfig';

export const login = async (loginId, password, userType = 'student') => {
  try {
    const response = await apiClient.post('/auth/login', {
      loginId,
      password,
      userType
    });
    
    // Store the token in localStorage
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    // The axios interceptor will handle 401 errors
    throw error;
  }
};

export const signup = async (userData) => {
  try {
    const response = await apiClient.post('/auth/signup', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};