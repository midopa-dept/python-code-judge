import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminHomePage from '../pages/admin/AdminHomePage';
import ProblemForm from '../components/Admin/ProblemForm';
import TestCaseManager from '../components/Admin/TestCaseManager';

const toastMocks = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
};

vi.mock('../components/Notification/useToast', () => ({
  __esModule: true,
  default: () => toastMocks,
  useToast: () => toastMocks,
}));

vi.mock('../api/auth', () => ({
  getCurrentUser: () => Promise.resolve({ name: '관리자', role: 'super_admin' }),
  logout: vi.fn(),
}));

describe('AdminHomePage', () => {
  it('관리자 주요 링크를 보여준다', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminHomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('관리자 홈')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '문제 등록 페이지' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '문제 수정 페이지' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '세션 관리 페이지' })).toBeInTheDocument();
  });
});

describe('ProblemForm', () => {
  it('입력 값을 기반으로 payload를 제출한다', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<ProblemForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/제목/), ' 새 문제 ');
    await user.type(screen.getByLabelText(/문제 설명/), ' 예시 설명 ');
    await user.clear(screen.getByLabelText(/배점/));
    await user.type(screen.getByLabelText(/배점/), '25');
    await user.click(screen.getByRole('button', { name: '문제 등록' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '새 문제',
        description: '예시 설명',
        score: 25,
      })
    );
  });
});

describe('TestCaseManager', () => {
  const baseCases = [
    { id: '1', order: 1, inputData: '1', expectedOutput: '1', isPublic: true },
    { id: '2', order: 2, inputData: '2', expectedOutput: '4', isPublic: false },
  ];

  it('테스트 케이스 추가/수정/삭제 동작을 호출한다', async () => {
    const onAdd = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <TestCaseManager
        problemId="p1"
        testCases={baseCases}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    await user.type(screen.getByPlaceholderText('입력 값을 작성하세요'), '1 2');
    await user.type(screen.getByPlaceholderText('예상 출력을 작성하세요'), '3');
    await user.click(screen.getByRole('button', { name: '테스트 케이스 추가' }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        inputData: '1 2',
        expectedOutput: '3',
        isPublic: true,
      })
    );

    await user.click(screen.getAllByRole('button', { name: '수정' })[0]);
    const outputField = screen.getAllByLabelText('출력')[0];
    await user.clear(outputField);
    await user.type(outputField, '10');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onUpdate).toHaveBeenCalledWith(
      baseCases[0],
      expect.objectContaining({
        expectedOutput: '10',
      })
    );

    await user.click(screen.getAllByRole('button', { name: '삭제' })[0]);
    expect(onDelete).toHaveBeenCalledWith(baseCases[0]);
  });
});
