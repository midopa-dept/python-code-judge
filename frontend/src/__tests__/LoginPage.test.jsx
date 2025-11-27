import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

const mockLogin = vi.fn();
const mockSignup = vi.fn();
const mockForgot = vi.fn();

vi.mock('../api/auth', () => ({
  login: (...args) => mockLogin(...args),
  signup: (...args) => mockSignup(...args),
  forgotPassword: (...args) => mockForgot(...args),
}));

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

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('학생/관리자 탭과 입력 필드를 렌더링한다', () => {
    renderLogin();
    expect(screen.getByRole('tab', { name: '학생' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '관리자' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByPlaceholderText('아이디를 입력하세요')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument();
  });

  it('탭을 전환하면 사용자 유형이 변경된다', async () => {
    const user = userEvent.setup();
    renderLogin();
    const adminTab = screen.getByRole('tab', { name: '관리자' });
    await user.click(adminTab);
    expect(adminTab).toHaveAttribute('aria-selected', 'true');
  });

  it('빈 값 제출 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    renderLogin();
    const form = screen.getByTestId('login-form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.queryByText(/아이디와 비밀번호를 모두 입력해주세요/)).toBeInTheDocument();
    });
  });

  it('로그인 성공 시 토큰 저장 및 리다이렉트를 수행한다', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ token: 'token123' });
    renderLogin();

    await user.type(screen.getByPlaceholderText('아이디를 입력하세요'), 'student1');
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123!');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(mockLogin).toHaveBeenCalledWith('student1', 'password123!', 'student');
    expect(localStorage.getItem('loginId')).toBe('student1');
    expect(toastMocks.showSuccess).toHaveBeenCalled();
  });

  it('로그인 실패 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({ response: { data: { message: '잘못된 자격 증명' } } });
    renderLogin();

    await user.type(screen.getByPlaceholderText('아이디를 입력하세요'), 'wrong');
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'wrong');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('잘못된 자격 증명');
    expect(toastMocks.showError).toHaveBeenCalled();
  });

  it('회원가입 모달에서 성공적으로 제출한다', async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue({});
    renderLogin();

    await user.click(screen.getByRole('button', { name: '회원가입' }));
    const modal = await screen.findByRole('dialog', { name: '회원가입' });

    await user.type(within(modal).getByPlaceholderText('아이디를 입력하세요'), 'newuser');
    await user.type(within(modal).getByPlaceholderText('군번을 입력하세요'), '123456');
    await user.type(within(modal).getByPlaceholderText('이름을 입력하세요'), '홍길동');
    await user.selectOptions(within(modal).getByLabelText(/계급/), '이병');
    await user.type(within(modal).getByPlaceholderText('이메일을 입력하세요'), 'new@user.com');
    await user.type(within(modal).getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await user.type(within(modal).getByPlaceholderText('비밀번호를 다시 입력하세요'), 'password123');
    const signupForm = within(modal).getByTestId('signup-form');
    fireEvent.submit(signupForm);

    await waitFor(() => expect(mockSignup).toHaveBeenCalledTimes(1));
    expect(mockSignup).toHaveBeenCalledWith({
      username: 'newuser',
      military_number: '123456',
      name: '홍길동',
      rank: '이병',
      email: 'new@user.com',
      password: 'password123',
    });
    expect(toastMocks.showSuccess).toHaveBeenCalled();
  });

  it('비밀번호 찾기 모달에서 이메일 전송을 시도한다', async () => {
    const user = userEvent.setup();
    mockForgot.mockResolvedValue({});
    renderLogin();

    await user.click(screen.getByRole('button', { name: '비밀번호 찾기' }));
    const modal = screen.getByRole('dialog', { name: '비밀번호 찾기' });

    await user.type(within(modal).getByLabelText(/이메일/), 'reset@user.com');
    await user.click(within(modal).getByRole('button', { name: '메일 보내기' }));

    expect(mockForgot).toHaveBeenCalledWith('reset@user.com');
    expect(toastMocks.showSuccess).toHaveBeenCalled();
  });
});
