import React from 'react';
import { Button } from '../Common';

const statusBadge = (status) => {
  const map = {
    scheduled: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    ended: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-700';
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{status}</span>;
};

const SessionManager = ({ sessions = [], onStart, onEnd, onReset, loadingIds = [] }) => {
  return (
    <div className="space-y-3">
      {sessions.length === 0 && <p className="text-sm text-gray-500">세션이 없습니다.</p>}
      {sessions.map((session) => {
        const busy = loadingIds.includes(session.id);
        return (
          <div
            key={session.id}
            className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div>
              <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                {session.name} {statusBadge(session.status)}
              </p>
              <p className="text-sm text-gray-600">
                {session.start_time?.slice(0, 16)} ~ {session.end_time?.slice(0, 16)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={busy || session.status !== 'scheduled'}
                onClick={() => onStart(session)}
              >
                세션 시작
              </Button>
              <Button
                variant="secondary"
                disabled={busy || session.status !== 'active'}
                onClick={() => onEnd(session)}
              >
                세션 종료
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => onReset(session)}
              >
                초기화
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionManager;
