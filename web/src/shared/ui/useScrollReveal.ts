import { useEffect, type CSSProperties, type RefObject } from 'react';

// Hiện dần các phần tử [data-reveal="up|left|right|zoom"] bên trong root khi chúng lướt vào màn hình.
// Chỉ ẩn nội dung sau khi JS đã chạy (class reveal-ready), nên không có JS / không có
// IntersectionObserver thì trang vẫn hiển thị đầy đủ.
export function useScrollReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>('[data-reveal]');

    if (typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    root.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // chỉ chạy một lần, lướt lên không ẩn lại
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    items.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove('reveal-ready');
    };
  }, [rootRef]);
}

// Độ trễ để các thẻ cùng hàng xuất hiện lần lượt.
export const revealDelay = (index: number, stepMs = 110) =>
  ({ '--reveal-delay': `${index * stepMs}ms` }) as CSSProperties;
