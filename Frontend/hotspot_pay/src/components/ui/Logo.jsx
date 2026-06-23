function Logo({ className = "h-8", showText = true, dark = true, logoSrc, appName = "HOTSPOTPAY" }) {
  const textCls = dark ? 'text-white' : 'text-slate-900'
  const accentCls = dark ? 'text-orange-500' : 'text-orange-600'

  // Si une URL de logo est fournie, afficher l'image
  if (logoSrc) {
    return (
      <div className={`flex items-center select-none gap-2 ${className}`}>
        <img src={logoSrc} alt={appName} className="h-full w-auto object-contain" />
        {showText && (
          <span className={`text-xl font-black tracking-tight ${textCls}`}>
            {appName.toUpperCase()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center select-none gap-2 ${className}`}>
      <svg
        viewBox="0 0 120 80"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ticketGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="60%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>

        <path
          d="M10 25C10 22.2386 12.2386 20 15 20H65C67.7614 20 70 22.2386 70 25C70 28.5 73 31 76.5 31C80 31 82.5 28.5 82.5 25V55C82.5 58.5 80 61 76.5 61C73 61 70 63.5 70 67C70 69.7614 67.7614 72 65 72H15C12.2386 72 10 69.7614 10 67C10 63.5 7 61 3.5 61C1.5 61 0 59.5 0 57.5V39.5C0 37.5 1.5 36 3.5 36C7 36 10 33.5 10 25Z"
          fill="url(#ticketGrad)"
        />

        <path
          d="M28 54C28 46 34.5 40.5 42 41C48.5 41.5 53 46 56.5 51L70.5 29.5M70.5 29.5H61M70.5 29.5V39"
          stroke="url(#ticketGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M58 15A22 22 0 0 1 89 3"
          stroke="url(#ticketGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M64 21A14 14 0 0 1 84 11"
          stroke="url(#ticketGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M71 27A6 6 0 0 1 79 21"
          stroke="url(#ticketGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <span className={`text-xl font-black tracking-tight ${textCls}`}>
          <span>HOTSPOT</span><span className={accentCls}>PAY</span>
        </span>
      )}
    </div>
  );
}

export default Logo;
