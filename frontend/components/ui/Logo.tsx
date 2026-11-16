import React from "react";

interface LogoProps {
  variant?: "full" | "icon" | "stacked";
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  size = "md",
  showTagline = false,
  className = "",
}) => {
  // Dimension mapping
  const sizeMap = {
    sm: { icon: 24, text: "text-base", sub: "text-[10px]" },
    md: { icon: 32, text: "text-xl", sub: "text-xs" },
    lg: { icon: 40, text: "text-2xl", sub: "text-sm" },
    xl: { icon: 48, text: "text-3xl", sub: "text-base" },
  };

  const { icon: iconDim, text: textSize, sub: subSize } = sizeMap[size];

  // Hexagonal Renewable Ledger Icon
  const IconMark = (
    <svg
      width={iconDim}
      height={iconDim}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="gl-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="60%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="gl-leaf-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>

      {/* Hexagonal Ledger Base (Decentralized Node) */}
      <polygon
        points="20,2 35,10 35,30 20,38 5,30 5,10"
        fill="currentColor"
        className="text-navy-900 dark:text-navy-800"
        stroke="#16A34A"
        strokeWidth="1.5"
      />

      {/* Internal Grid Interconnect Lines */}
      <line x1="20" y1="2" x2="20" y2="20" stroke="#16A34A" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="5" y1="30" x2="20" y2="20" stroke="#16A34A" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="35" y1="30" x2="20" y2="20" stroke="#16A34A" strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Clean Renewable Energy Blade / Lightning Ray */}
      <path
        d="M20 7L24 16H18L21 27L13 17H19L16 7H20Z"
        fill="url(#gl-leaf-grad)"
      />

      {/* Cryptographic Ledger Node Vertices */}
      <circle cx="20" cy="2" r="2.5" fill="#4ADE80" />
      <circle cx="35" cy="10" r="2.5" fill="#22C55E" />
      <circle cx="35" cy="30" r="2.5" fill="#16A34A" />
      <circle cx="20" cy="38" r="2.5" fill="#15803D" />
      <circle cx="5" cy="30" r="2.5" fill="#16A34A" />
      <circle cx="5" cy="10" r="2.5" fill="#22C55E" />
      <circle cx="20" cy="20" r="2" fill="#FFFFFF" />
    </svg>
  );

  if (variant === "icon") {
    return <div className={`inline-flex items-center ${className}`}>{IconMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {IconMark}
      <div className={`flex flex-col ${variant === "stacked" ? "items-center text-center" : ""}`}>
        <span className={`font-bold tracking-tight text-navy-900 dark:text-white ${textSize} leading-tight`}>
          Green<span className="text-brand-600 dark:text-brand-400">Ledger</span>
        </span>
        {showTagline && (
          <span className={`text-navy-500 dark:text-navy-400 font-medium tracking-normal ${subSize} mt-0.5`}>
            Powering a Fairer, Greener Energy Future.
          </span>
        )}
      </div>
    </div>
  );
};
