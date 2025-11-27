import React, { useEffect, useState } from 'react';
import { getSubmissions } from '../../api/student';
import { Header, Footer, LoadingSpinner } from '../../components/Common';
import useToast from '../../components/Notification/useToast';

const SubmissionsPage = () => {
  const toast = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const data = await getSubmissions({});
        const submissionList = data.submissions || data.items || data || [];
        setSubmissions(submissionList);
      } catch (error) {
        toast.showError('제출 이력을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const normalizeStatus = (status) => {
    const s = (status || '').toString().trim().toUpperCase();
    if (s === 'OK') return 'AC';
    return s || 'PENDING';
  };

  const formatMemory = (bytes) => {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) return '-';
    const mb = value / (1024 * 1024);
    return `${mb >= 10 ? mb.toFixed(1) : mb.toFixed(2)}MB`;
  };

  const getStatusBadge = (status) => {
    const s = normalizeStatus(status);
    const badges = {
      AC: <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded">✅ 정답</span>,
      WA: <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">❌ 오답</span>,
      TLE: <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded">⏱️ 시간초과</span>,
      MLE: <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded">💾 메모리초과</span>,
      RE: <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded">⚠️ 런타임에러</span>,
      SE: <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded">🚫 보안제한</span>,
      PENDING: <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded">⏳ 대기중</span>,
      JUDGING: <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded">🔄 채점중</span>,
    };

    return badges[s] || <span className="text-gray-400">-</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">제출 이력</h1>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner label="제출 이력 로딩 중" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">제출 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제출 시각</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">문제</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">결과</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">실행 시간</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">메모리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(submission.submittedAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {submission.problemTitle || `문제 #${submission.problemId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {Number.isFinite(Number(submission.executionTime))
                          ? `${submission.executionTime}ms`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatMemory(submission.memoryUsage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubmissionsPage;
