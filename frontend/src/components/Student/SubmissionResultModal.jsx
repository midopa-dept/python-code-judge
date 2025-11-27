import React from 'react';
import { Modal, Button } from '../Common';

const SubmissionResultModal = ({ open, onClose, result }) => {
  if (!result) return null;

  const detailRows = [
    { label: '채점 상태', value: result.status || result.result },
    { label: '실행 시간', value: result.runtime ? `${result.runtime}ms` : '-' },
    { label: '메모리', value: result.memory ? `${result.memory}MB` : '-' },
    { label: '언어', value: result.pythonVersion || 'Python' },
    { label: '채점 메시지', value: result.message || '메시지 없음' },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title="채점 결과 상세" size="md">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">제출 #{result.id || result.submissionId}</span>
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
            {result.status || result.result}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {detailRows.map((row) => (
            <div key={row.label} className="text-sm">
              <p className="text-gray-500">{row.label}</p>
              <p className="font-medium text-gray-900">{row.value}</p>
            </div>
          ))}
        </div>
        {result.errorLogs && (
          <div>
            <p className="text-sm font-semibold text-gray-800">에러 로그</p>
            <pre className="mt-2 bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-auto max-h-48">
              {result.errorLogs}
            </pre>
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SubmissionResultModal;
