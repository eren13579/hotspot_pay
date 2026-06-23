function AuthLoader({ label, width = "100px", height = "auto" }) {
  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 90"
        className="hotspotpay-loader"
        style={{ width, height }} // Application dynamique de la taille
      >
        <defs>
          <linearGradient
            id="wifiBlueGradient"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#0052D4" />
            <stop offset="50%" stopColor="#4364F7" />
            <stop offset="100%" stopColor="#6FB1FC" />
          </linearGradient>
        </defs>

        <style>{`
          .hotspotpay-loader {
            display: block;
            margin: 0 auto;
          }
          .hotspotpay-loader .wifi-element {
            fill: none;
            stroke: #E0E4E8;
            stroke-width: 7.5;
            stroke-linecap: round;
            transform-origin: 50% 80px;
            animation: smoothWave 1.6s infinite ease-in-out;
          }
          .hotspotpay-loader circle.wifi-element {
            fill: #E0E4E8;
            stroke: none;
          }
          
          .hotspotpay-loader .dot   { animation-delay: 0.0s; }
          .hotspotpay-loader .arc-1 { animation-delay: 0.15s; }
          .hotspotpay-loader .arc-2 { animation-delay: 0.30s; }
          .hotspotpay-loader .arc-3 { animation-delay: 0.45s; }

          @keyframes smoothWave {
            0%, 100% {
              stroke: #E0E4E8;
              transform: scale(1);
            }
            30% {
              stroke: url(#wifiBlueGradient);
              transform: scale(1.03);
            }
            60%, 80% {
              stroke: #E0E4E8;
              transform: scale(1);
            }
          }

          @keyframes smoothWaveDot {
            0%, 100% { fill: #E0E4E8; transform: scale(1); }
            30% { fill: #0052D4; transform: scale(1.1); }
            60%, 80% { fill: #E0E4E8; transform: scale(1); }
          }
          .hotspotpay-loader circle.dot {
            animation-name: smoothWaveDot;
          }
        `}</style>

        <circle cx="50" cy="80" r="5.5" className="wifi-element dot" />
        <path d="M 35,65 A 21,21 0 0 1 65,65" className="wifi-element arc-1" />
        <path d="M 20,50 A 42,42 0 0 1 80,50" className="wifi-element arc-2" />
        <path d="M 5,35 A 63,63 0 0 1 95,35" className="wifi-element arc-3" />
      </svg>

      {label && (
        <p className="text-sm font-medium text-gray-400 tracking-wide animate-pulse text-center">
          {label}
        </p>
      )}
    </div>
  );
}

export default AuthLoader;
