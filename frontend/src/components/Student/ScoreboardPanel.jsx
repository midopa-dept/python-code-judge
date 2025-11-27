import React from 'react';
import { Card, Button, Input } from '../Common';

const ScoreboardPanel = ({
  sessionId,
  onSessionChange,
  scoreboard,
  loading,
  onRefresh,
}) => {
  return (
    <Card
      title="실시간 스코어보드"
      headerActions={
        <div className="flex items-center gap-2">
          <Input
            id="session-id"
            placeholder="세션 ID 입력"
            value={sessionId}
            onChange={(e) => onSessionChange(e.target.value)}
            className="w-36"
          />
          <Button size="sm" variant="secondary" onClick={onRefresh} aria-label="스코어보드 새로고침">
            새로고침
          </Button>
        </div>
      }
    >
      {loading && <p className="text-sm text-gray-500">스코어보드를 불러오는 중입니다...</p>}
      {!loading && (!scoreboard || scoreboard.length === 0) && (
        <p className="text-sm text-gray-500">스코어보드 데이터가 없습니다.</p>
      )}
      <div className="space-y-2">
        {scoreboard &&
          scoreboard.map((row, index) => (
            <div
              key={`${row.studentId || index}-${row.rank || index}`}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-800">
                  {row.rank ?? index + 1}위
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{row.studentName || '학생'}</p>
                  <p className="text-xs text-gray-600">
                    맞힌 문제 {row.acceptedCount ?? 0} · 총 제출 {row.submissionCount ?? 0}
                  </p>
                </div>
              </div>
              <div className="text-sm font-semibold text-primary-700">
                점수 {row.score ?? row.totalScore ?? 0}
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
};

export default ScoreboardPanel;
