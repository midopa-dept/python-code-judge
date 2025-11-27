import React, { useEffect, useState, useCallback } from 'react';
import { getMyScoreboard } from '../../api/student';
import { Header, Footer, LoadingSpinner } from '../../components/Common';
import useToast from '../../components/Notification/useToast';

const ScoreboardPage = () => {
  const toast = useToast();
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchScoreboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyScoreboard();
      const scoreboardList = data.scoreboard || data.items || data.scoreboard || [];
      setSessionInfo(data.session || null);
      setErrorMessage('');
      setScoreboard(scoreboardList);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        '스코어보드를 불러오지 못했습니다.';
      setErrorMessage(msg);
      setSessionInfo(null);
      setScoreboard([]);
      toast.showError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScoreboard();
    const interval = setInterval(fetchScoreboard, 5000);
    return () => clearInterval(interval);
  }, [fetchScoreboard]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">스코어보드</h1>

          {sessionInfo && (
            <div className="mb-4 text-sm text-gray-700">
              <p className="font-semibold">세션: {sessionInfo.name || `#${sessionInfo.id}`}</p>
              <p className="text-gray-500">
                상태: {sessionInfo.status} · 시작: {sessionInfo.startTime?.slice(0, 16)} · 종료:{' '}
                {sessionInfo.endTime?.slice(0, 16)}
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner label="스코어보드 로딩 중" />
            </div>
          ) : errorMessage && !sessionInfo ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">{errorMessage || '참여 중인 세션이 없습니다.'}</p>
            </div>
          ) : scoreboard.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">스코어보드 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">순위</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">점수</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">해결 문제 수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scoreboard.map((entry, index) => (
                    <tr key={entry.studentId} className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-bold text-gray-900">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index >= 3 && entry.rank}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {entry.studentName || `학생 #${entry.studentId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-primary-600">
                        {entry.score}점
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {entry.solvedCount}문제
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

export default ScoreboardPage;
