import React, { useEffect, useState, useCallback } from 'react';
import {
  getProblems,
  getProblemDetail,
  submitCode,
  getSubmissions,
  getSubmissionResult,
  getScoreboard,
} from '../api/student';
import { Header, Footer, LoadingSpinner } from '../components/Common';
import ProblemList from '../components/Student/ProblemList';
import ProblemDetail from '../components/Student/ProblemDetail';
import SubmissionHistory from '../components/Student/SubmissionHistory';
import ScoreboardPanel from '../components/Student/ScoreboardPanel';
import SubmissionResultModal from '../components/Student/SubmissionResultModal';
import useToast from '../components/Notification/useToast';

const StudentPage = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', category: '', difficulty: '' });
  const [problems, setProblems] = useState([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [problemDetail, setProblemDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [code, setCode] = useState('');
  const [pythonVersion, setPythonVersion] = useState('3.10');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [scoreboard, setScoreboard] = useState([]);
  const [scoreboardSessionId, setScoreboardSessionId] = useState('');
  const [scoreboardLoading, setScoreboardLoading] = useState(false);

  const fetchProblems = useCallback(async () => {
    setProblemsLoading(true);
    try {
      const data = await getProblems({
        search: filters.search,
        category: filters.category,
        difficulty: filters.difficulty,
      });
      const problemList = data.problems || data.items || data || [];
      setProblems(problemList);
      if (!selectedProblemId && problemList.length > 0) {
        setSelectedProblemId(problemList[0].id);
      }
    } catch (error) {
      toast.showError('문제 목록을 불러오지 못했습니다.');
    } finally {
      setProblemsLoading(false);
    }
  }, [filters, selectedProblemId, toast]);

  const fetchDetail = useCallback(
    async (problemId) => {
      if (!problemId) return;
      setDetailLoading(true);
      try {
        const data = await getProblemDetail(problemId);
        setProblemDetail(data);
        setCode(data.initialCode || data.boilerplate || '');
        if (data.defaultPythonVersion) {
          setPythonVersion(data.defaultPythonVersion);
        }
        if (data.activeSessionId) {
          setScoreboardSessionId((prev) => prev || `${data.activeSessionId}`);
        }
      } catch (error) {
        toast.showError('문제 정보를 불러오지 못했습니다.');
        setProblemDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  const fetchHistory = useCallback(
    async (problemId) => {
      if (!problemId) return;
      setHistoryLoading(true);
      try {
        const data = await getSubmissions({ problemId });
        const submissionList = data.submissions || data.items || data || [];
        setHistory(submissionList);
      } catch (error) {
        toast.showError('제출 이력을 불러오지 못했습니다.');
      } finally {
        setHistoryLoading(false);
      }
    },
    [toast]
  );

  const fetchScoreboardData = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      setScoreboardLoading(true);
      try {
        const data = await getScoreboard(sessionId);
        const scoreboardList = data.scoreboard || data.items || data || [];
        setScoreboard(scoreboardList);
      } catch (error) {
        toast.showError('스코어보드를 불러오지 못했습니다.');
      } finally {
        setScoreboardLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    if (selectedProblemId) {
      fetchDetail(selectedProblemId);
      fetchHistory(selectedProblemId);
    }
  }, [selectedProblemId, fetchDetail, fetchHistory]);

  useEffect(() => {
    if (!scoreboardSessionId) return;
    fetchScoreboardData(scoreboardSessionId);
    const interval = setInterval(() => fetchScoreboardData(scoreboardSessionId), 5000);
    return () => clearInterval(interval);
  }, [scoreboardSessionId, fetchScoreboardData]);

  const handleSubmit = async () => {
    if (!selectedProblemId) {
      toast.showInfo('문제를 선택해주세요.');
      return;
    }
    if (!code.trim()) {
      toast.showWarning('코드를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitCode({
        problemId: selectedProblemId,
        code,
        pythonVersion,
      });
      toast.showSuccess('제출을 완료했습니다. 결과가 곧 표시됩니다.');
      setLastResult(response);
      setResultModalOpen(true);
      fetchHistory(selectedProblemId);
    } catch (error) {
      const message = error?.response?.data?.message || '코드 제출에 실패했습니다.';
      toast.showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHistoryClick = async (submissionId) => {
    try {
      const result = await getSubmissionResult(submissionId);
      setLastResult(result);
      setResultModalOpen(true);
    } catch (error) {
      toast.showError('채점 결과를 불러오지 못했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProblemList
              problems={problems}
              loading={problemsLoading}
              filters={filters}
              onFilterChange={setFilters}
              selectedProblemId={selectedProblemId}
              onSelectProblem={setSelectedProblemId}
              onReload={fetchProblems}
            />
            {detailLoading ? (
              <div className="flex items-center justify-center bg-white rounded-lg shadow-md">
                <LoadingSpinner label="문제 정보를 불러오는 중입니다..." />
              </div>
            ) : (
              <ProblemDetail
                problem={problemDetail}
                code={code}
                onCodeChange={setCode}
                pythonVersion={pythonVersion}
                onPythonVersionChange={setPythonVersion}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SubmissionHistory
              submissions={history}
              loading={historyLoading}
              onRefresh={() => fetchHistory(selectedProblemId)}
              onSelectSubmission={handleHistoryClick}
            />
            <ScoreboardPanel
              sessionId={scoreboardSessionId}
              onSessionChange={setScoreboardSessionId}
              scoreboard={scoreboard}
              loading={scoreboardLoading}
              onRefresh={() => fetchScoreboardData(scoreboardSessionId)}
            />
          </div>
        </div>
      </main>
      <Footer />
      <SubmissionResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={lastResult}
      />
    </div>
  );
};

export default StudentPage;
