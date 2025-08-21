export function OpenRouterIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>OpenRouter icon</title>
      <circle cx="12" cy="12" r="10" fill="#0A7AFF" />
      <path
        d="M7 12a5 5 0 0 1 10 0"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="12" cy="12" r="2" fill="#fff" />
    </svg>
  );
}
