import React, { useEffect, useState } from 'react';
import { Button, Input, Textarea } from '../Common';

const categories = [
  '입출력',
  '조건문',
  '반복문',
  '리스트',
  '문자열',
  '함수',
  '재귀',
  '정렬',
  '탐색',
  '동적계획법',
  '기타',
];

const visibilityOptions = ['public', 'private', 'draft'];

const ProblemForm = ({ initialData, onSubmit, submitting }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: categories[0],
    difficulty: 1,
    time_limit: 2,
    memory_limit: 256,
    score: 1,
    visibility: 'public',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || categories[0],
        difficulty: initialData.difficulty || 1,
        time_limit: initialData.timeLimit || initialData.time_limit || 2,
        memory_limit: initialData.memoryLimit || initialData.memory_limit || 256,
        score: initialData.score || 1,
        visibility: initialData.visibility || 'public',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ['difficulty', 'time_limit', 'memory_limit', 'score'].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    onSubmit?.({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      difficulty: Number(form.difficulty),
      timeLimit: Number(form.time_limit),
      memoryLimit: Number(form.memory_limit),
      score: Number(form.score),
      visibility: form.visibility,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="제목"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="문제 제목을 입력하세요"
        required
      />
      <Textarea
        label="문제 설명"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="문제 설명을 작성하세요 (마크다운 가능)"
        rows={4}
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="시간 제한 (초)"
          name="time_limit"
          type="number"
          min={1}
          max={10}
          value={form.time_limit}
          onChange={handleChange}
        />
        <Input
          label="메모리 제한 (MB)"
          name="memory_limit"
          type="number"
          min={64}
          max={2048}
          value={form.memory_limit}
          onChange={handleChange}
        />
        <Input
          label="점수"
          name="score"
          type="number"
          min={1}
          value={form.score}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">공개 상태</label>
          <select
            name="visibility"
            value={form.visibility}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {visibilityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" loading={submitting} className="w-full">
            {initialData?.id ? '문제 수정' : '문제 등록'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ProblemForm;
