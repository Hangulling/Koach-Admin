interface HamburgerIconProps {
  className?: string;
  size?: number;
}

export default function HamburgerIcon({ className = "", size = 20 }: HamburgerIconProps) {
  const height = (size * 14) / 18;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 18 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M1 1H17M1 7H17M1 13H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}