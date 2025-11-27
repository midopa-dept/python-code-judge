import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

function HealthCheckPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/health'); // axiosConfig를 통해 apiClient 사용
        setHealthStatus(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-2">
            Python Judge
          </h1>
          <p className="text-gray-600">
            Python 코딩 테스트 자동 채점 플랫폼
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            시스템 상태
          </h2>

          {loading && (
            <div className="text-center text-gray-600">
              상태 확인 중...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-error font-medium">⚠️ 백엔드 연결 실패</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
              <p className="text-sm text-gray-500 mt-2">
                백엔드 서버가 실행 중인지 확인해주세요: <code className="bg-gray-200 px-1 rounded">npm start</code>
              </p>
            </div>
          )}

          {healthStatus && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">상태:</span>
                <span className="px-3 py-1 bg-success text-white rounded-full text-sm font-medium">
                  {healthStatus.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">환경:</span>
                <span className="text-gray-600">{healthStatus.environment}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">데이터베이스:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthStatus.database === 'connected'
                    ? 'bg-success text-white'
                    : 'bg-warning text-white'
                }`}>
                  {healthStatus.database}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">가동 시간:</span>
                <span className="text-gray-600">
                  {Math.floor(healthStatus.uptime)} 초
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">타임스탬프:</span>
                <span className="text-gray-600 text-sm">
                  {new Date(healthStatus.timestamp).toLocaleString('ko-KR')}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Phase 0 환경 설정이 완료되었습니다!
          </p>
          <div className="flex gap-3 justify-center">
            <button className="btn btn-primary">
              로그인
            </button>
            <button className="btn btn-secondary">
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthCheckPage;