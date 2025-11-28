import axios from 'axios';

// 백엔드 API 기본 URL 설정
// 프로덕션: Render 백엔드 URL 사용
// 개발: localhost:3000 사용 (별도 서버)
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://python-code-judge-1.onrender.com/api'
  : 'http://localhost:3000/api';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - JWT 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRedirectingToLogin = false;

// 응답 인터셉터 - 토큰 만료 처리 등
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 토큰 만료 시 처리
    // 토큰 만료 시 처리
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      const currentPath = window.location.pathname;
      const isOnLogin = currentPath.startsWith('/login');
      if (!isOnLogin && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        // 현재 경로를 리다이렉트 파라미터로 포함하여 로그인 페이지로 이동
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
