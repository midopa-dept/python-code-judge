import React from 'react';
import { Card, Button, Select } from '../Common';

const pythonOptions = [
  { value: '3.8', label: 'Python 3.8' },
  { value: '3.9', label: 'Python 3.9' },
  { value: '3.10', label: 'Python 3.10' },
  { value: '3.11', label: 'Python 3.11' },
  { value: '3.12', label: 'Python 3.12' },
];

const ProblemDetail = ({
  problem,
  code,
  onCodeChange,
  pythonVersion,
  onPythonVersionChange,
  onSubmit,
  submitting,
}) => {
  return (
    <Card
      title="문제 상세 · 코드 작성"
      headerActions={
        <div className="flex items-center gap-2">
          <Select
            id="python-version"
            options={pythonOptions}
            value={pythonVersion}
            onChange={(e) => onPythonVersionChange(e.target.value)}
            aria-label="파이썬 버전 선택"
          />
          <Button onClick={onSubmit} loading={submitting} aria-label="코드 제출">
            코드 제출
          </Button>
        </div>
      }
    >
      {problem ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-3">
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              {problem.category || '카테고리 미정'}
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              난이도 {problem.difficulty || '-'}
            </span>
            {problem.timeLimit && (
              <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                시간 {problem.timeLimit}s
              </span>
            )}
            {problem.memoryLimit && (
              <span className="text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded-full">
                메모리 {problem.memoryLimit}MB
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{problem.title}</h2>
          <p className="text-gray-700 whitespace-pre-line">{problem.description || '설명이 없습니다.'}</p>
          {problem.samples && problem.samples.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800">예제 입출력</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {problem.samples.map((sample, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-gray-700">예제 {index + 1}</p>
                    <p className="text-gray-600 mt-1">
                      <span className="font-medium">입력: </span>
                      <span className="whitespace-pre-line">{sample.input}</span>
                    </p>
                    <p className="text-gray-600 mt-1">
                      <span className="font-medium">출력: </span>
                      <span className="whitespace-pre-line">{sample.output}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">코드 입력</p>
              <p className="text-xs text-gray-500">Ctrl+Enter 또는 Cmd+Enter 로 제출할 수 있습니다.</p>
            </div>
            <textarea
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              className="w-full h-64 md:h-80 font-mono text-sm border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
              placeholder="여기에 Python 코드를 작성하세요"
              aria-label="코드 에디터"
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">선택된 문제가 없습니다.</p>
      )}
    </Card>
  );
};

export default ProblemDetail;
