// A small hand-drawn-style sprig flanked by hairline rules — echoes the
// botanical branches in the real JiaPan Bakery logo (see
// public/logo-reference.jpg) without copying it directly. Colored via
// currentColor so it inherits whatever text color class it's given.
export default function BotanicalDivider({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="0" y1="20" x2="88" y2="20" stroke="currentColor" strokeWidth="1" />
      <line x1="152" y1="20" x2="240" y2="20" stroke="currentColor" strokeWidth="1" />
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M120 34 C118 26 122 16 120 4" />
        <path d="M120 24 C112 20 107 12 110 6" />
        <path d="M120 24 C128 20 133 12 130 6" />
        <path d="M120 15 C115 12 112 7 113 3" />
        <path d="M120 15 C125 12 128 7 127 3" />
      </g>
      <circle cx="120" cy="37" r="1.4" fill="currentColor" />
    </svg>
  );
}
