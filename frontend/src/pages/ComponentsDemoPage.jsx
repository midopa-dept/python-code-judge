import { useState } from 'react';
import { Button, Card, LoadingSpinner, Modal } from '../components/Common';
import useToast from '../components/Notification/useToast';

const ComponentsDemoPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState('md');
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const openModal = (size) => {
    setModalSize(size);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2 text-center">
          <p className="text-sm font-semibold text-primary-700">Phase 4 · 공통 컴포넌트</p>
          <h1 className="text-3xl font-bold text-gray-900">공통 컴포넌트 샘플</h1>
          <p className="text-gray-600">
            로딩 스피너, 토스트 알림, 모달을 한 곳에서 빠르게 확인할 수 있는 샘플 페이지입니다.
          </p>
        </header>

        <Card title="로딩 스피너">
          <div className="flex flex-wrap gap-6 items-center">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">작은 사이즈</p>
              <LoadingSpinner size="sm" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">기본 사이즈</p>
              <LoadingSpinner />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">큰 사이즈</p>
              <LoadingSpinner size="lg" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">가장 큰 사이즈</p>
              <LoadingSpinner size="xl" />
            </div>
          </div>
        </Card>

        <Card title="토스트 알림 (react-toastify)">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => showSuccess('성공적으로 처리되었습니다. 🎉')}>성공 토스트</Button>
            <Button variant="secondary" onClick={() => showInfo('정보를 불러왔습니다.')}>
              정보 토스트
            </Button>
            <Button variant="outline" onClick={() => showWarning('잠시 후 다시 시도해 주세요.')}>
              경고 토스트
            </Button>
            <Button variant="danger" onClick={() => showError('오류가 발생했습니다.')}>
              오류 토스트
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ToastProvider가 앱 루트에 포함되어 있어 어디서든 useToast 훅으로 알림을 띄울 수 있습니다.
          </p>
        </Card>

        <Card title="모달 컴포넌트">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => openModal('sm')}>작은 모달 열기</Button>
            <Button variant="secondary" onClick={() => openModal('md')}>
              기본 모달 열기
            </Button>
            <Button variant="outline" onClick={() => openModal('lg')}>
              큰 모달 열기
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            오버레이 클릭이나 닫기 버튼으로 모달을 닫을 수 있으며, size prop으로 폭을 제어할 수 있습니다.
          </p>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="모달 예시" size={modalSize}>
        <div className="space-y-3">
          <p className="text-gray-700">
            공통 모달 컴포넌트입니다. 헤더, 오버레이, 크기 변경을 기본 제공하며 포털로 렌더링됩니다.
          </p>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <LoadingSpinner size="sm" label="모달 내부 로딩 중" />
            <span>비동기 작업 예시로 스피너를 함께 배치할 수 있습니다.</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              닫기
            </Button>
            <Button onClick={closeModal}>확인</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComponentsDemoPage;
