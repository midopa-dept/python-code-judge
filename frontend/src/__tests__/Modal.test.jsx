import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../components/Common/Modal';

describe('Modal', () => {
  it('닫혀 있을 때는 렌더링되지 않는다', () => {
    const { container } = render(<Modal isOpen={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('열렸을 때 제목과 접근성 속성을 제공한다', () => {
    render(
      <Modal isOpen title="모달 제목" onClose={() => {}}>
        <p>내용</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog', { name: '모달 제목' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('모달 제목')).toBeInTheDocument();
  });

  it('오버레이와 닫기 버튼으로 onClose를 호출한다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen title="모달 제목" onClose={onClose}>
        <p>내용</p>
      </Modal>
    );

    const overlay = document.querySelector('.bg-opacity-50');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeButton = screen.getByRole('button', { name: '모달 닫기' });
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
