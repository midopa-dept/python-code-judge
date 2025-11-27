import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProblems } from '../../api/student';
import { Header, Footer, LoadingSpinner, Input, Button } from '../../components/Common';
import useToast from '../../components/Notification/useToast';

const CATEGORIES = [
  { value: '', label: '전체', count: 0 },
  { value: '입출력', label: '입출력' },
  { value: '조건문', label: '조건문' },
  { value: '반복문', label: '반복문' },
  { value: '리스트', label: '리스트' },
  { value: '문자열', label: '문자열' },
  { value: '함수', label: '함수' },
  { value: '재귀', label: '재귀' },
  { value: '정렬', label: '정렬' },
  { value: '탐색', label: '탐색' },
  { value: '동적계획법', label: '동적계획법' },
  { value: '기타', label: '기타' },
];

const DIFFICULTIES = [
  { value: '', label: '전체' },
  { value: 1, label: '⭐ 쉬움' },
  { value: 2, label: '⭐⭐ 보통' },
  { value: 3, label: '⭐⭐⭐ 어려움' },
  { value: 4, label: '⭐⭐⭐⭐ 매우 어려움' },
  { value: 5, label: '⭐⭐⭐⭐⭐ 최고난이도' },
];

const ProblemListPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 문제 목록 조회
  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const data = await getProblems({
          search: debouncedSearchQuery,
          category: selectedCategory,
          difficulty: selectedDifficulty,
        });
        const problemList = data.problems || data.items || data || [];
        const normalized = problemList.map((p) => {
          const last = (p.lastStatus || '').toString().toUpperCase();
          const myStatus = p.isSolved ? 'AC' : last || null;
          return { ...p, myStatus };
        });
        setProblems(normalized);
      } catch (error) {
        toast.showError('문제 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedCategory, selectedDifficulty]);

  const handleProblemClick = (problemId) => {
    navigate(`/student/problems/${problemId}`);
  };

  const getDifficultyStars = (difficulty) => {
    return '⭐'.repeat(difficulty || 1);
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="text-gray-400">미제출</span>;

    const badges = {
      AC: <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">✅ 정답</span>,
      WA: <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">❌ 오답</span>,
      TLE: <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">⏱️ 시간초과</span>,
      MLE: <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">💾 메모리초과</span>,
      RE: <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">⚠️ 런타임에러</span>,
      SE: <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">🚫 보안제한</span>,
      PENDING: <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">⏳ 대기중</span>,
      JUDGING: <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">🔄 채점중</span>,
    };

    const key = status?.toString().toUpperCase();
    return badges[key] || <span className="text-gray-400">미제출</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* 좌측 사이드바 - 카테고리 */}
        <aside className="w-64 bg-white shadow-md p-6 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">카테고리</h2>
          <nav>
            <ul className="space-y-2">
              {CATEGORIES.map((category) => (
                <li key={category.value}>
                  <button
                    onClick={() => setSelectedCategory(category.value)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-primary-100 text-primary-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.label}
                    {category.count > 0 && (
                      <span className="ml-2 text-sm text-gray-500">({category.count})</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* 우측 메인 콘텐츠 - 문제 목록 */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">문제 목록</h1>

            {/* 검색 및 필터 */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="문제 제목 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 문제 카드 리스트 */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner label="문제 목록 로딩 중" />
              </div>
            ) : problems.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-lg">문제가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {problems.map((problem) => (
                  <div
                    key={problem.id}
                    onClick={() => handleProblemClick(problem.id)}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow cursor-pointer bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          📄 {problem.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>난이도: {getDifficultyStars(problem.difficulty)}</span>
                          {problem.successRate && (
                            <span>정답률: {problem.successRate}%</span>
                          )}
                          {problem.submissionCount && (
                            <span>제출: {problem.submissionCount}회</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(problem.myStatus)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProblemListPage;
