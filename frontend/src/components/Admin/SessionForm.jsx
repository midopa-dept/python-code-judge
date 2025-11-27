import React, { useState } from 'react';
import { Button, Input } from '../Common';

const sessionTypes = [
  { value: 'regular', label: '정규' },
  { value: 'exam', label: '평가' },
  { value: 'practice', label: '연습' },
];

const SessionForm = ({ onSubmit, submitting }) => {
  const [form, setForm] = useState({
    name: '',
    start_time: '',
    end_time: '',
    session_type: 'regular',
    allow_resubmit: true,
    problemIds: '',
    studentIds: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const parseIdList = (value) =>
    value
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((v) => !Number.isNaN(v));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.start_time || !form.end_time) return;

    onSubmit?.({
      name: form.name.trim(),
      startTime: form.start_time,
      endTime: form.end_time,
      sessionType: form.session_type,
      allowResubmit: form.allow_resubmit,
      problemIds: parseIdList(form.problemIds),
      studentIds: parseIdList(form.studentIds),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="세션 이름"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="세션 이름을 입력하세요"
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="시작 시각"
          type="datetime-local"
          name="start_time"
          value={form.start_time}
          onChange={handleChange}
          required
        />
        <Input
          label="종료 시각"
          type="datetime-local"
          name="end_time"
          value={form.end_time}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">세션 타입</label>
          <select
            name="session_type"
            value={form.session_type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {sessionTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="allow_resubmit"
            checked={form.allow_resubmit}
            onChange={handleChange}
          />
          재제출 허용
        </label>
        <div className="flex justify-end">
          <Button type="submit" loading={submitting} className="w-full md:w-auto">
            세션 생성
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="할당 문제 ID 목록 (쉼표 구분)"
          name="problemIds"
          value={form.problemIds}
          onChange={handleChange}
          placeholder="예: 1,2,3"
        />
        <Input
          label="학생 ID 목록 (쉼표 구분)"
          name="studentIds"
          value={form.studentIds}
          onChange={handleChange}
          placeholder="예: 11,12,13"
        />
      </div>
    </form>
  );
};

export default SessionForm;
