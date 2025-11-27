import React, { useEffect, useState } from 'react';
import { Header, Footer, Button, LoadingSpinner } from '../../components/Common';
import AdminPanelCard from '../../components/Admin/AdminPanelCard';
import SessionForm from '../../components/Admin/SessionForm';
import SessionManager from '../../components/Admin/SessionManager';
import useToast from '../../components/Notification/useToast';
import { fetchSessions, createSession, updateSessionStatus, resetSession, assignProblems, assignStudents } from '../../api/admin';
import { Link } from 'react-router-dom';

const SessionManagePage = () => {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyIds, setBusyIds] = useState([]);

  const loadSessions = async () => {
    const data = await fetchSessions();
    const list = data.sessions || data.items || data || [];
    setSessions(list);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadSessions();
      } catch (error) {
        toast.showError('세션 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSessionCreate = async (form) => {
    try {
      setSubmitting(true);
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
      setSubmitting(false);
    }
  };

  const updateStatus = async (session, status) => {
    try {
      setBusyIds((prev) => [...prev, session.id]);
      await updateSessionStatus(session.id, status);
      toast.showSuccess(`세션 상태가 ${status}로 변경되었습니다.`);
      await loadSessions();
    } catch (error) {
      const msg = error?.response?.data?.message || '세션 상태 변경에 실패했습니다.';
      toast.showError(msg);
    } finally {
      setBusyIds((prev) => prev.filter((id) => id !== session.id));
    }
  };

  const handleReset = async (session) => {
    try {
      setBusyIds((prev) => [...prev, session.id]);
      await resetSession(session.id);
      toast.showWarning('세션이 초기화되었습니다.');
      await loadSessions();
    } catch (error) {
      const msg = error?.response?.data?.message || '세션 초기화에 실패했습니다.';
      toast.showError(msg);
    } finally {
      setBusyIds((prev) => prev.filter((id) => id !== session.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <LoadingSpinner label="세션 관리 페이지를 준비하고 있습니다..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700 font-semibold">관리자 대시보드</p>
            <h1 className="text-2xl font-bold text-gray-900">세션 관리</h1>
            <p className="text-sm text-gray-600">세션 생성, 상태 변경, 초기화를 분리된 화면에서 관리합니다.</p>
          </div>
          <Link to="/admin">
            <Button variant="secondary">관리자 홈</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminPanelCard title="세션 생성">
            <SessionForm onSubmit={handleSessionCreate} submitting={submitting} />
          </AdminPanelCard>
          <AdminPanelCard title="세션 목록">
            <SessionManager
              sessions={sessions}
              onStart={(s) => updateStatus(s, 'active')}
              onEnd={(s) => updateStatus(s, 'ended')}
              onReset={handleReset}
              loadingIds={busyIds}
            />
          </AdminPanelCard>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SessionManagePage;
