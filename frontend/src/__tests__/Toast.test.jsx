import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastProvider from '../components/Notification/ToastProvider';
import useToast from '../components/Notification/useToast';

const ToastTrigger = () => {
  const { showSuccess } = useToast();

  return (
    <button type="button" onClick={() => showSuccess('성공적으로 처리되었습니다')}>
      토스트 트리거
    </button>
  );
};

describe('Toast 알림', () => {
  it('성공 토스트를 표시한다', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByText('토스트 트리거'));
    expect(await screen.findByText('성공적으로 처리되었습니다')).toBeInTheDocument();
  });
});
