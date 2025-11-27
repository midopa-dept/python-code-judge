import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';

vi.mock('../api/admin', () => ({
  fetchProblems: vi.fn().mockResolvedValue({
    problems: [{ id: 1, title: '샘플 문제', difficulty: 1, score: 1 }],
  }),
  fetchProblemDetail: vi.fn().mockResolvedValue({
    id: 1,
    title: '샘플 문제',
    publicTestCases: [],
  }),
  createProblem: vi.fn(),
  updateProblem: vi.fn(),
  addTestCase: vi.fn(),
  fetchSessions: vi.fn().mockResolvedValue({
    sessions: [
      {
        id: 1,
        name: '세션 1',
        status: 'scheduled',
        start_time: '2025-01-01T10:00:00Z',
        end_time: '2025-01-01T12:00:00Z',
      },
    ],
  }),
  createSession: vi.fn(),
  updateSessionStatus: vi.fn(),
  resetSession: vi.fn(),
  assignProblems: vi.fn(),
  assignStudents: vi.fn(),
}));

// 토스트 훅 모킹
vi.mock('../components/Notification/useToast', () => ({
  __esModule: true,
  default: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
  }),
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

// 공통 Header/Footer 내부에서 호출되는 getCurrentUser 모킹
vi.mock('../api/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: 999, name: '관리자', role: 'admin' }),
  logout: vi.fn(),
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin dashboard and loads problems/sessions', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('관리자 대시보드')).toBeInTheDocument();
    });

    expect(screen.getByText('문제 등록/수정')).toBeInTheDocument();
    expect(screen.getAllByText('세션 생성').length).toBeGreaterThan(0);

    // 문제 목록 선택 박스
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('샘플 문제').length).toBeGreaterThan(0);
    });

    // 세션 카드
    expect(screen.getByText('세션 1')).toBeInTheDocument();
  });
});
