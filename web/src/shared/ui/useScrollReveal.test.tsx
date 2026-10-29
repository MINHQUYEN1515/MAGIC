import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { useScrollReveal } from './useScrollReveal';

function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal(ref);
  return (
    <div ref={ref} data-testid="root">
      <p data-reveal="up">Nội dung</p>
    </div>
  );
}

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

describe('useScrollReveal', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('hiện phần tử khi lướt tới', () => {
    let trigger: Callback = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: Callback) {
          trigger = cb;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    render(<Demo />);
    const item = screen.getByText('Nội dung');

    expect(screen.getByTestId('root')).toHaveClass('reveal-ready');
    expect(item).not.toHaveClass('is-visible');

    act(() => trigger([{ isIntersecting: true, target: item }]));

    expect(item).toHaveClass('is-visible');
  });

  it('không có IntersectionObserver thì hiện ngay, không ẩn nội dung', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<Demo />);

    expect(screen.getByTestId('root')).not.toHaveClass('reveal-ready');
    expect(screen.getByText('Nội dung')).toHaveClass('is-visible');
  });
});
