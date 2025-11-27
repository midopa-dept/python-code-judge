import React from 'react';
import { Card, Button } from '../Common';

const statusBadge = (status) => {
  const base = 'px-2 py-1 rounded-full text-xs font-semibold';
  switch (status) {
    case 'AC':
      return `${base} bg-green-100 text-green-700`;
    case 'WA':
      return `${base} bg-red-100 text-red-700`;
    case 'TLE':
      return `${base} bg-amber-100 text-amber-700`;
    case 'RE':
    case 'SE':
      return `${base} bg-purple-100 text-purple-700`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
};

const SubmissionHistory = ({ submissions, loading, onRefresh, onSelectSubmission }) => {
  return (
    <Card
      title="제출 이력"
      headerActions={
        <Button size="sm" variant="secondary" onClick={onRefresh} aria-label="제출 이력 새로고침">
          새로고침
        </Button>
      }
    >
      {loading && <p className="text-sm text-gray-500">이력을 불러오는 중입니다...</p>}
      {!loading && submissions.length === 0 && (
        <p className="text-sm text-gray-500">아직 제출한 기록이 없습니다.</p>
      )}
      <div className="space-y-3">
        {submissions.map((submission) => (
          <button
            key={submission.id}
            onClick={() => onSelectSubmission(submission.id)}
            className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-primary-400 transition"
          >
            <div className="flex justify-between items-center gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                  제출 ID #{submission.id}{' '}
                  <span className={statusBadge(submission.result || submission.status)}>
                    {submission.result || submission.status}
                  </span>
                </p>
                <p className="text-xs text-gray-600">
                  실행 시간 {submission.runtime || '-'}ms · 메모리 {submission.memory || '-'}MB ·
                  언어 {submission.pythonVersion || 'Python 3.10'}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                {submission.submittedAt
                  ? new Date(submission.submittedAt).toLocaleString()
                  : '방금 전'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default SubmissionHistory;
