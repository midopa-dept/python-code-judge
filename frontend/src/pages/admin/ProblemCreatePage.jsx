import React from 'react';
import { Header, Footer, Button } from '../../components/Common';
import AdminPanelCard from '../../components/Admin/AdminPanelCard';
import ProblemForm from '../../components/Admin/ProblemForm';
import useToast from '../../components/Notification/useToast';
import { createProblem } from '../../api/admin';
import { useNavigate, Link } from 'react-router-dom';

const ProblemCreatePage = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    try {
      const res = await createProblem(payload);
      const newId = res?.problemId || res?.id;
      toast.showSuccess('문제가 등록되었습니다.');
      if (newId) {
        navigate(`/admin/problems/${newId}/edit`);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || '문제 등록에 실패했습니다.';
      toast.showError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700 font-semibold">관리자 전용</p>
            <h1 className="text-2xl font-bold text-gray-900">문제 등록</h1>
            <p className="text-sm text-gray-600">
              새 문제의 기본 정보와 점수를 입력하세요. 테스트 케이스 추가는 등록 후 수정 페이지에서 관리합니다.
            </p>
          </div>
          <Link to="/admin">
            <Button variant="secondary">관리자 홈으로</Button>
          </Link>
        </div>

        <AdminPanelCard title="문제 정보 입력">
          <ProblemForm onSubmit={handleSubmit} />
        </AdminPanelCard>
      </main>
      <Footer />
    </div>
  );
};

export default ProblemCreatePage;
