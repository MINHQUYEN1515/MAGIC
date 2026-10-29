// Hoạ tiết hoa sen giữa hai vạch kẻ, đặt dưới tiêu đề mỗi section.
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <span className={`ornament ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="28" height="28">
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M16 5c3.5 4 3.5 11 0 17-3.5-6-3.5-13 0-17z" />
          <path d="M16 22c-2-5-6-8-11-8 0 5 4 9 11 8z" />
          <path d="M16 22c2-5 6-8 11-8 0 5-4 9-11 8z" />
          <path d="M6 26h20" />
        </g>
      </svg>
    </span>
  );
}

export function SectionTitle({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <div className={`section-title${light ? ' section-title--light' : ''}`}>
      <h2>{children}</h2>
      <Ornament />
    </div>
  );
}
