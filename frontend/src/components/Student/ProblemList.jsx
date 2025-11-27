import React from 'react';
import { Card, Input, Select, Button } from '../Common';

const categoryOptions = [
  { value: '', label: '전체' },
  { value: 'math', label: '수학' },
  { value: 'string', label: '문자열' },
  { value: 'graph', label: '그래프' },
  { value: 'dp', label: 'DP' },
];

const difficultyOptions = [
  { value: '', label: '전체' },
  { value: '1', label: '쉬움 (1)' },
  { value: '2', label: '보통 (2)' },
  { value: '3', label: '중간 (3)' },
  { value: '4', label: '어려움 (4)' },
  { value: '5', label: '매우 어려움 (5)' },
];

const ProblemList = ({
  problems,
  loading,
  filters,
  onFilterChange,
  selectedProblemId,
  onSelectProblem,
  onReload,
}) => {
  return (
    <Card
      title="문제 목록"
      headerActions={
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onReload} aria-label="문제 새로고침">
            새로고침
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Input
          label="검색"
          id="search"
          placeholder="문제 제목 또는 태그 검색"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="col-span-1 md:col-span-3"
        />
        <Select
          label="카테고리"
          id="category"
          options={categoryOptions}
          value={filters.category}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
        />
        <Select
          label="난이도"
          id="difficulty"
          options={difficultyOptions}
          value={filters.difficulty}
          onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value })}
        />
      </div>

      <div className="border rounded-lg divide-y">
        {loading && <div className="p-4 text-sm text-gray-500">문제를 불러오는 중입니다...</div>}
        {!loading && problems.length === 0 && (
          <div className="p-4 text-sm text-gray-500">조건에 맞는 문제가 없습니다.</div>
        )}
        {!loading &&
          problems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => onSelectProblem(problem.id)}
              className={`w-full text-left p-4 hover:bg-primary-50 transition ${
                selectedProblemId === problem.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-500">
                    {problem.category || '카테고리 없음'} · 난이도 {problem.difficulty || '-'}
                  </p>
                  <p className="text-base font-semibold text-gray-900">{problem.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {problem.acceptanceRate !== undefined && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      정답률 {problem.acceptanceRate}%
                    </span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    제출 {problem.submissionCount || 0}
                  </span>
                </div>
              </div>
              {problem.summary && <p className="mt-2 text-sm text-gray-600">{problem.summary}</p>}
            </button>
          ))}
      </div>
    </Card>
  );
};

export default ProblemList;
