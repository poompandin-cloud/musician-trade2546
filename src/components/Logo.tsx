const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Penguin Icon */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Body */}
          <ellipse cx="32" cy="38" rx="18" ry="22" fill="#1a1a2e" />
          {/* Belly */}
          <ellipse cx="32" cy="42" rx="12" ry="16" fill="white" />
          {/* Head */}
          <circle cx="32" cy="18" r="14" fill="#1a1a2e" />
          {/* Eyes */}
          <circle cx="27" cy="16" r="3" fill="white" />
          <circle cx="37" cy="16" r="3" fill="white" />
          <circle cx="27.5" cy="16.5" r="1.5" fill="#1a1a2e" />
          <circle cx="37.5" cy="16.5" r="1.5" fill="#1a1a2e" />
          {/* Beak */}
          <path d="M32 20 L28 26 L36 26 Z" fill="hsl(18, 100%, 60%)" />
          {/* Feet */}
          <ellipse cx="26" cy="58" rx="5" ry="3" fill="hsl(18, 100%, 60%)" />
          <ellipse cx="38" cy="58" rx="5" ry="3" fill="hsl(18, 100%, 60%)" />
          {/* Wings */}
          <path d="M14 32 Q8 42 12 52 Q18 48 18 38 Z" fill="#1a1a2e" />
          <path d="M50 32 Q56 42 52 52 Q46 48 46 38 Z" fill="#1a1a2e" />
          {/* Headphones */}
          <path 
            d="M18 18 Q18 6 32 6 Q46 6 46 18" 
            stroke="hsl(18, 100%, 60%)" 
            strokeWidth="3" 
            fill="none"
          />
          <circle cx="18" cy="18" r="4" fill="hsl(18, 100%, 60%)" />
          <circle cx="46" cy="18" r="4" fill="hsl(18, 100%, 60%)" />
        </svg>
      </div>
      {/* Text */}
      <div className="flex flex-col">
        <span className="text-2xl font-bold tracking-tight text-foreground font-display">
          snowguin<span className="text-primary">.</span>
        </span>
      </div>
    </div>
  );
};

export default Logo;
