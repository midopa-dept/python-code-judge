import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import StudentPage from '../pages/StudentPage';

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

const apiMocks = vi.hoisted(() => ({
  getProblems: vi.fn(),
  getProblemDetail: vi.fn(),
  submitCode: vi.fn(),
  getSubmissions: vi.fn(),
  getSubmissionResult: vi.fn(),
  getScoreboard: vi.fn(),
}));

vi.mock('../api/student', () => apiMocks);

vi.mock('../api/auth', () => ({
  getCurrentUser: () => Promise.resolve({ name: '학생', role: 'student' }),
  logout: vi.fn(),
}));

const renderStudentPage = () =>
  render(
    <MemoryRouter initialEntries={['/student']}>
      <Routes>
        <Route path="/student" element={<StudentPage />} />
      </Routes>
    </MemoryRouter>
  );

const sampleProblem = {
  id: 'p1',
  title: '문제 1',
  category: 'dp',
  difficulty: 3,
  summary: '간단한 예시',
  description: '이것은 문제 설명입니다.',
  initialCode: '# 초기 코드',
  samples: [{ input: '1', output: '1' }],
  activeSessionId: 's1',
};

const sampleSubmissions = [
  { id: 's-1', result: 'AC', runtime: 120, memory: 32, pythonVersion: '3.10', submittedAt: '2025-11-26T12:00:00Z' },
];

const sampleScoreboard = [
  { rank: 1, studentName: '홍길동', acceptedCount: 2, submissionCount: 3, score: 120 },
];

describe('StudentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getProblems.mockResolvedValue({ items: [sampleProblem] });
    apiMocks.getProblemDetail.mockResolvedValue(sampleProblem);
    apiMocks.submitCode.mockResolvedValue({ id: 's-2', status: 'AC', runtime: 100, memory: 28 });
    apiMocks.getSubmissions.mockResolvedValue({ items: sampleSubmissions });
    apiMocks.getSubmissionResult.mockResolvedValue({ id: 's-1', status: 'AC', runtime: 120, memory: 32 });
    apiMocks.getScoreboard.mockResolvedValue({ items: sampleScoreboard });
  });

  it('초기 로드 시 문제 목록과 상세를 보여준다', async () => {
    renderStudentPage();

    expect(apiMocks.getProblems).toHaveBeenCalled();
    expect(await screen.findAllByText('문제 1')).not.toHaveLength(0);
    await waitFor(() => expect(apiMocks.getProblemDetail).toHaveBeenCalledWith('p1'));
    expect(screen.getByRole('textbox', { name: '코드 에디터' })).toBeInTheDocument();
  });

  it('검색어가 변경되면 문제 목록을 다시 불러온다', async () => {
    const user = userEvent.setup();
    renderStudentPage();
    await screen.findAllByText('문제 1');

    const searchInput = screen.getByLabelText('검색');
    await user.type(searchInput, '그래프');

    await waitFor(() => expect(apiMocks.getProblems.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('코드를 제출하면 토스트와 결과 모달을 띄우고 이력을 새로 불러온다', async () => {
    const user = userEvent.setup();
    renderStudentPage();
    await screen.findAllByText('문제 1');

    const codeArea = screen.getByRole('textbox', { name: '코드 에디터' });
    await user.clear(codeArea);
    await user.type(codeArea, 'print(1)');
    await user.click(screen.getByRole('button', { name: '코드 제출' }));

    expect(apiMocks.submitCode).toHaveBeenCalledWith({
      problemId: 'p1',
      code: 'print(1)',
      pythonVersion: '3.10',
    });
    expect(toastMocks.showSuccess).toHaveBeenCalled();
    expect(await screen.findByRole('dialog', { name: '채점 결과 상세' })).toBeInTheDocument();
    expect(apiMocks.getSubmissions).toHaveBeenCalledTimes(2);
  });

  it('제출 이력을 클릭하면 결과를 불러온다', async () => {
    renderStudentPage();
    const historyItem = await screen.findByText(/제출 ID/);
    historyItem.click();

    await waitFor(() => expect(apiMocks.getSubmissionResult).toHaveBeenCalledWith('s-1'));
    expect(await screen.findByRole('dialog', { name: '채점 결과 상세' })).toBeInTheDocument();
  });

  it('스코어보드는 문제의 activeSessionId로 갱신한다', async () => {
    renderStudentPage();
    await screen.findAllByText('문제 1');

    await waitFor(() => expect(apiMocks.getScoreboard).toHaveBeenCalledWith('s1'));
    const refreshButton = screen.getByRole('button', { name: '스코어보드 새로고침' });
    refreshButton.click();
    await waitFor(() => expect(apiMocks.getScoreboard.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
