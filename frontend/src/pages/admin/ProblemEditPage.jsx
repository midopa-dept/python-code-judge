import React, { useEffect, useState } from 'react';
import { Header, Footer, Button, LoadingSpinner } from '../../components/Common';
import AdminPanelCard from '../../components/Admin/AdminPanelCard';
import ProblemForm from '../../components/Admin/ProblemForm';
import TestCaseManager from '../../components/Admin/TestCaseManager';
import useToast from '../../components/Notification/useToast';
import {
  fetchProblems,
  fetchProblemDetail,
  fetchTestCases,
  updateProblem,
  addTestCase,
  updateTestCase,
  deleteTestCase,
} from '../../api/admin';
import { Link, useParams } from 'react-router-dom';

const ProblemEditPage = () => {
  const toast = useToast();
  const { id: paramId } = useParams();
  const [problems, setProblems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [problemDetail, setProblemDetail] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProblemDetail = async (id) => {
    const detail = await fetchProblemDetail(id);
    setProblemDetail(detail);
    const tcs = await fetchTestCases(id);
    setTestCases(tcs || []);
  };

  const loadProblems = async (preferredId) => {
    const data = await fetchProblems();
    const list = data.problems || data.items || data || [];
    setProblems(list);
    const targetId = preferredId || list?.[0]?.id || list?.[0]?.problemId || null;
    const nextId = targetId ? String(targetId) : null;
    setSelectedId(nextId);
    if (nextId) {
      await loadProblemDetail(nextId);
    } else {
      setProblemDetail(null);
      setTestCases([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadProblems(paramId);
      } catch (error) {
        toast.showError('문제 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [paramId]);

  const handleSelectProblem = async (id) => {
    setSelectedId(id);
    try {
      await loadProblemDetail(id);
    } catch (error) {
      toast.showError('문제 정보를 불러오지 못했습니다.');
    }
  };

  const handleSave = async (payload) => {
    if (!selectedId) return;
    try {
      setSaving(true);
      await updateProblem(selectedId, payload);
      toast.showSuccess('문제가 수정되었습니다.');
      await loadProblemDetail(selectedId);
    } catch (error) {
      const msg = error?.response?.data?.message || '문제 수정에 실패했습니다.';
      toast.showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTestCase = async (payload) => {
    if (!selectedId) return;
    try {
      await addTestCase(selectedId, payload);
      toast.showSuccess('테스트 케이스가 추가되었습니다.');
      const tcs = await fetchTestCases(selectedId);
      setTestCases(tcs || []);
    } catch (error) {
      const msg = error?.response?.data?.message || '테스트 케이스 추가에 실패했습니다.';
      toast.showError(msg);
    }
  };

  const handleUpdateTestCase = async (tc, payload) => {
    if (!selectedId || !tc.id) return;
    try {
      await updateTestCase(selectedId, tc.id, payload);
      toast.showSuccess('테스트 케이스가 수정되었습니다.');
      const tcs = await fetchTestCases(selectedId);
      setTestCases(tcs || []);
    } catch (error) {
      const msg = error?.response?.data?.message || '테스트 케이스 수정에 실패했습니다.';
      toast.showError(msg);
    }
  };

  const handleDeleteTestCase = async (tc) => {
    if (!selectedId || !tc.id) return;
    try {
      await deleteTestCase(selectedId, tc.id);
      toast.showWarning('테스트 케이스가 삭제되었습니다.');
      const tcs = await fetchTestCases(selectedId);
      setTestCases(tcs || []);
    } catch (error) {
      const msg = error?.response?.data?.message || '테스트 케이스 삭제에 실패했습니다.';
      toast.showError(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <LoadingSpinner label="문제 수정 페이지를 준비하고 있습니다..." />
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
            <h1 className="text-2xl font-bold text-gray-900">문제 수정</h1>
            <p className="text-sm text-gray-600">
              문제 기본 정보와 점수, 테스트 케이스를 수정하고 순서를 관리하세요.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin">
              <Button variant="secondary">관리자 홈</Button>
            </Link>
            <Link to="/admin/problems/new">
              <Button>새 문제 등록</Button>
            </Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-3">
          <div className="text-sm text-gray-700">문제 선택</div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64"
            value={selectedId || ''}
            onChange={(e) => handleSelectProblem(e.target.value)}
          >
            {problems.length === 0 && <option value="">등록된 문제가 없습니다</option>}
            {problems.map((p) => {
              const value = p.id || p.problemId;
              return (
                <option key={value} value={value}>
                  {p.title}
                </option>
              );
            })}
          </select>
        </div>

        {problemDetail ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminPanelCard title="문제 정보 수정">
              <ProblemForm initialData={problemDetail} onSubmit={handleSave} submitting={saving} />
            </AdminPanelCard>
            <AdminPanelCard title="테스트 케이스 관리">
              <TestCaseManager
                problemId={selectedId}
                testCases={testCases}
                onAdd={handleAddTestCase}
                onUpdate={handleUpdateTestCase}
                onDelete={handleDeleteTestCase}
              />
            </AdminPanelCard>
          </div>
        ) : (
          <p className="text-sm text-gray-600">선택된 문제가 없습니다.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProblemEditPage;
