interface WishouseLogoProps {
  size?: number;
  className?: string;
}

export function WishouseLogo({ size = 32, className }: WishouseLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded square */}
      <rect width="32" height="32" rx="8" fill="#6366f1" />

      {/* House roof */}
      <path
        d="M16 6L26 14H22V25H10V14H6L16 6Z"
        fill="white"
        fillOpacity="0.2"
      />
      <path
        d="M16 7.5L24.5 14.5H21.5V24H10.5V14.5H7.5L16 7.5Z"
        stroke="white"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="white"
        fillOpacity="0.15"
      />

      {/* Euro sign inside house */}
      <text
        x="16"
        y="21.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="white"
      >
        €
      </text>
    </svg>
  );
}

export function WishouseLogoFull({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <WishouseLogo size={32} />
      <span className="font-bold text-lg tracking-tight">Wishouse</span>
    </div>
  );
}
