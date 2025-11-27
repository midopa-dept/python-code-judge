import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../components/Common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('기본 상태로 렌더링되며 접근성 속성을 포함한다', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status', { name: '로딩 중' });
    expect(spinner).toBeInTheDocument();
    expect(spinner.querySelector('svg')).toHaveClass('animate-spin');
    expect(screen.getByText('로딩 중')).toHaveClass('sr-only');
  });

  it('사이즈 prop에 따라 클래스가 적용된다', () => {
    render(<LoadingSpinner size="lg" />);
    const svg = screen.getByRole('status').querySelector('svg');
    expect(svg).toHaveClass('h-12', 'w-12');
  });
});
