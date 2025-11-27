import React, { useState } from 'react';
import { Button, Input, Textarea } from '../Common';

const TestCaseManager = ({ problemId, testCases = [], onAdd, loading }) => {
  const [form, setForm] = useState({
    inputData: '',
    expectedOutput: '',
    isPublic: true,
    order: (testCases?.length || 0) + 1,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.inputData.trim() || !form.expectedOutput.trim()) return;
    onAdd?.({
      inputData: form.inputData,
      expectedOutput: form.expectedOutput,
      isPublic: form.isPublic,
      order: Number(form.order) || 0,
    });
    setForm((prev) => ({
      ...prev,
      inputData: '',
      expectedOutput: '',
      order: (testCases?.length || 0) + 2,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-gray-900">테스트 케이스 목록</h4>
        <span className="text-sm text-gray-600">총 {testCases.length}개</span>
      </div>
      <div className="space-y-3 max-h-64 overflow-auto pr-2">
        {testCases.length === 0 && <p className="text-sm text-gray-500">등록된 테스트 케이스가 없습니다.</p>}
        {testCases.map((tc) => (
          <div
            key={tc.id || tc.order}
            className="border border-gray-200 rounded-lg p-3 bg-gray-50 text-sm space-y-2"
          >
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-semibold">케이스 #{tc.order ?? tc.id}</span>
              <span className={tc.isPublic ? 'text-green-700' : 'text-gray-700'}>
                {tc.isPublic ? '공개' : '비공개'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">입력</p>
              <pre className="whitespace-pre-wrap bg-white border border-gray-200 rounded p-2">{tc.inputData}</pre>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">출력</p>
              <pre className="whitespace-pre-wrap bg-white border border-gray-200 rounded p-2">
                {tc.expectedOutput}
              </pre>
            </div>
          </div>
        ))}
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Textarea
          label="입력"
          name="inputData"
          value={form.inputData}
          onChange={handleChange}
          placeholder="입력을 작성하세요"
          rows={3}
          required
        />
        <Textarea
          label="출력"
          name="expectedOutput"
          value={form.expectedOutput}
          onChange={handleChange}
          placeholder="예상 출력을 작성하세요"
          rows={3}
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label="노출 순서"
            name="order"
            type="number"
            value={form.order}
            onChange={handleChange}
            min={0}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} />
            공개 테스트 케이스
          </label>
          <Button type="submit" loading={loading} className="w-full md:w-auto">
            테스트 케이스 추가
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TestCaseManager;
