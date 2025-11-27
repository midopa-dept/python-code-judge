import React, { useEffect, useMemo, useState } from 'react';
import AdminPanelCard from '../../components/Admin/AdminPanelCard';
import ProblemForm from '../../components/Admin/ProblemForm';
import TestCaseManager from '../../components/Admin/TestCaseManager';
import SessionForm from '../../components/Admin/SessionForm';
import SessionManager from '../../components/Admin/SessionManager';
import { Header, Footer, Button, LoadingSpinner } from '../../components/Common';
import {
  fetchProblems,
  fetchProblemDetail,
  createProblem,
  updateProblem,
  addTestCase,
  fetchSessions,
  createSession,
  updateSessionStatus,
  resetSession,
  assignProblems,
  assignStudents,
} from '../../api/admin';
import useToast from '../../components/Notification/useToast';

const AdminDashboardPage = () => {
  const toast = useToast();
  const [problems, setProblems] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [problemDetail, setProblemDetail] = useState(null);
  const [submittingProblem, setSubmittingProblem] = useState(false);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busySessions, setBusySessions] = useState([]);

  const selectedProblem = useMemo(
    () => problems.find((p) => p.id === selectedProblemId) || null,
    [problems, selectedProblemId]
  );

  const loadProblems = async (problemToSelect) => {
    const data = await fetchProblems();
    const list = data.problems || data.items || data || [];
    setProblems(list);
    const firstId = problemToSelect || list?.[0]?.id || null;
    setSelectedProblemId(firstId);
    if (firstId) {
      const detail = await fetchProblemDetail(firstId);
      setProblemDetail(detail);
    } else {
      setProblemDetail(null);
    }
  };

  const loadSessions = async () => {
    const data = await fetchSessions();
    const list = data.sessions || data.items || data || [];
    setSessions(list);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadProblems(), loadSessions()]);
      } catch (error) {
        toast.showError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSelectProblem = async (id) => {
    setSelectedProblemId(id);
    try {
      const detail = await fetchProblemDetail(id);
      setProblemDetail(detail);
    } catch (error) {
      toast.showError('문제 상세를 불러오지 못했습니다.');
    }
  };

  const handleProblemSave = async (payload) => {
    try {
      setSubmittingProblem(true);
      if (selectedProblem?.id) {
        await updateProblem(selectedProblem.id, payload);
        toast.showSuccess('문제가 수정되었습니다.');
        await loadProblems(selectedProblem.id);
      } else {
        const res = await createProblem(payload);
        const newId = res?.problemId || res?.id;
        toast.showSuccess('문제가 등록되었습니다.');
        await loadProblems(newId);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || '문제 저장에 실패했습니다.';
      toast.showError(msg);
    } finally {
      setSubmittingProblem(false);
    }
  };

  const handleAddTestCase = async (payload) => {
    if (!selectedProblemId) return;
    try {
      await addTestCase(selectedProblemId, payload);
      toast.showSuccess('테스트 케이스가 추가되었습니다.');
      const detail = await fetchProblemDetail(selectedProblemId);
      setProblemDetail(detail);
    } catch (error) {
      const msg = error?.response?.data?.message || '테스트 케이스 추가에 실패했습니다.';
      toast.showError(msg);
    }
  };

  const handleSessionCreate = async (form) => {
    try {
      setSubmittingSession(true);
      const basePayload = {
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        sessionType: form.sessionType,
        allowResubmit: form.allowResubmit,
      };
      const session = await createSession(basePayload);
      const sessionId = session.id || session.sessionId;

      if (form.problemIds?.length) {
        const problemsPayload = form.problemIds.map((pid, idx) => ({
          problemId: pid,
          order: idx + 1,
        }));
        await assignProblems(sessionId, problemsPayload);
      }

      if (form.studentIds?.length) {
        await assignStudents(sessionId, form.studentIds);
      }

      toast.showSuccess('세션이 생성되었습니다.');
      await loadSessions();
    } catch (error) {
      const msg = error?.response?.data?.message || '세션 생성에 실패했습니다.';
      toast.showError(msg);
    } finally {
      setSubmittingSession(false);
    }
  };

  const updateStatus = async (session, status) => {
    try {
      setBusySessions((prev) => [...prev, session.id]);
      await updateSessionStatus(session.id, status);
      toast.showSuccess(`세션 상태가 ${status}로 변경되었습니다.`);
      await loadSessions();
    } catch (error) {
      const msg = error?.response?.data?.message || '세션 상태 변경에 실패했습니다.';
      toast.showError(msg);
    } finally {
      setBusySessions((prev) => prev.filter((id) => id !== session.id));
    }
  };

  const handleReset = async (session) => {
    try {
      setBusySessions((prev) => [...prev, session.id]);
      await resetSession(session.id);
      toast.showWarning('세션이 초기화되었습니다.');
      await loadSessions();
    } catch (error) {
      const msg = error?.response?.data?.message || '세션 초기화에 실패했습니다.';
      toast.showError(msg);
    } finally {
      setBusySessions((prev) => prev.filter((id) => id !== session.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <LoadingSpinner label="관리자 페이지 로딩 중" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700 font-semibold">관리자 전용</p>
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-sm text-gray-600">문제 관리, 테스트 케이스 관리, 세션 관리 기능을 제공합니다.</p>
          </div>
          <Button variant="secondary" onClick={() => Promise.all([loadProblems(), loadSessions()])}>
            새로고침
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminPanelCard
            title="문제 등록/수정"
            description="제목, 난이도, 제한, 점수를 설정해 문제를 등록하거나 수정하세요."
          >
            <ProblemForm
              initialData={selectedProblem}
              onSubmit={handleProblemSave}
              submitting={submittingProblem}
            />
          </AdminPanelCard>

          <AdminPanelCard
            title="문제 선택 및 테스트 케이스"
            description="문제를 선택하고 공개/비공개 테스트 케이스를 관리하세요."
            actions={
              <select
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={selectedProblemId || ''}
                onChange={(e) => handleSelectProblem(e.target.value)}
              >
                {problems.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            }
          >
            <div className="space-y-3 mb-4">
              {selectedProblem && (
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{selectedProblem.title}</span> · 점수{' '}
                  {selectedProblem.score ?? 1} · 난이도 {selectedProblem.difficulty}
                </div>
              )}
              <TestCaseManager
                problemId={selectedProblemId}
                testCases={problemDetail?.publicTestCases || []}
                onAdd={handleAddTestCase}
              />
            </div>
          </AdminPanelCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminPanelCard title="세션 생성" description="세션을 생성하고 문제/학생을 할당하세요.">
            <SessionForm onSubmit={handleSessionCreate} submitting={submittingSession} />
          </AdminPanelCard>

          <AdminPanelCard title="세션 관리" description="세션 시작/종료, 초기화를 수행합니다.">
            <SessionManager
              sessions={sessions}
              onStart={(s) => updateStatus(s, 'active')}
              onEnd={(s) => updateStatus(s, 'ended')}
              onReset={handleReset}
              loadingIds={busySessions}
            />
          </AdminPanelCard>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
