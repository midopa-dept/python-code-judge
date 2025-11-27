import React, { useState } from 'react';
import { Button, Input, Textarea } from '../Common';

const TestCaseManager = ({ problemId, testCases = [], onAdd, onUpdate, onDelete, loading }) => {
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
            <EditableCase
              testCase={tc}
              onUpdate={(payload) => onUpdate?.(tc, payload)}
              onDelete={() => onDelete?.(tc)}
              loading={loading}
            />
          </div>
        ))}
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Textarea
          label="입력"
          id="inputData"
          name="inputData"
          value={form.inputData}
          onChange={handleChange}
          placeholder="입력 값을 작성하세요"
          rows={3}
          required
        />
        <Textarea
          label="출력"
          id="expectedOutput"
          name="expectedOutput"
          value={form.expectedOutput}
          onChange={handleChange}
          placeholder="예상 출력을 작성하세요"
          rows={3}
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label="출력 순서"
            id="order"
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

const EditableCase = ({ testCase, onUpdate, onDelete, loading }) => {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({
    inputData: testCase.inputData,
    expectedOutput: testCase.expectedOutput,
    isPublic: testCase.isPublic,
    order: testCase.order,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDraft((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = () => {
    onUpdate?.({
      inputData: draft.inputData,
      expectedOutput: draft.expectedOutput,
      isPublic: draft.isPublic,
      order: Number(draft.order) || 0,
    });
    setEdit(false);
  };

  if (!edit) {
    return (
      <div className="space-y-2">
        <div>
          <p className="font-medium text-gray-700 mb-1">입력</p>
          <pre className="whitespace-pre-wrap bg-white border border-gray-200 rounded p-2">{testCase.inputData}</pre>
        </div>
        <div>
          <p className="font-medium text-gray-700 mb-1">출력</p>
          <pre className="whitespace-pre-wrap bg-white border border-gray-200 rounded p-2">
            {testCase.expectedOutput}
          </pre>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEdit(true)}>
            수정
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete} disabled={loading}>
            삭제
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        label="입력"
        id={`edit-input-${testCase.id}`}
        name="inputData"
        value={draft.inputData}
        onChange={handleChange}
        rows={3}
      />
      <Textarea
        label="출력"
        id={`edit-output-${testCase.id}`}
        name="expectedOutput"
        value={draft.expectedOutput}
        onChange={handleChange}
        rows={3}
      />
      <div className="flex items-center gap-3 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPublic" checked={draft.isPublic} onChange={handleChange} />
          공개
        </label>
        <Input
          label="순서"
          id={`order-${testCase.id}`}
          name="order"
          type="number"
          value={draft.order}
          onChange={handleChange}
          className="w-24"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          저장
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setEdit(false)}>
          취소
        </Button>
      </div>
    </div>
  );
};

export default TestCaseManager;
