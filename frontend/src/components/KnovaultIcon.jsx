import React from 'react';

const KnovaultIcon = ({ size = 36, animated = false, className = '' }) => {
  const s = size;
  const pad = s * 0.15;
  const inner = s - pad * 2;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: s, height: s }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`kvault-grad-${s}`} x1="0" y1="0" x2={s} y2={s} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F7BFF" />
            <stop offset="100%" stopColor="#7E9DFF" />
          </linearGradient>
          <filter id={`kvault-glow-${s}`}>
            <feGaussianBlur stdDeviation={s * 0.08} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {animated && (
            <>
              <filter id={`kvault-electric-${s}`}>
                <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" result="noise" seed="3">
                  <animate attributeName="seed" from="1" to="100" dur="2s" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={s * 0.06} />
              </filter>
              <filter id={`kvault-pulse-${s}`}>
                <feGaussianBlur stdDeviation={s * 0.12} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </>
          )}
        </defs>

        {/* Electric glow background */}
        {animated && (
          <circle
            cx={s / 2}
            cy={s / 2}
            r={s * 0.42}
            fill={`url(#kvault-grad-${s})`}
            opacity="0.15"
            filter={`url(#kvault-pulse-${s})`}
          >
            <animate attributeName="opacity" values="0.1;0.25;0.1" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="r" values={`${s * 0.38};${s * 0.44};${s * 0.38}`} dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Main background */}
        <rect
          x={pad * 0.5}
          y={pad * 0.5}
          width={inner + pad}
          height={inner + pad}
          rx={s * 0.22}
          fill={`url(#kvault-grad-${s})`}
          filter={`url(#kvault-glow-${s})`}
        />

        {/* k letter */}
        <text
          x={s / 2}
          y={s * 0.72}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize={s * 0.52}
          fill="white"
          textAnchor="middle"
          letterSpacing="-1"
          filter={animated ? `url(#kvault-electric-${s})` : undefined}
        >
          k
        </text>

        {/* Electric arcs */}
        {animated && (
          <>
            {/* Left arc */}
            <path
              d={`M${pad * 0.5} ${s * 0.3} L${pad * 0.15} ${s * 0.22} L${pad * 0.4} ${s * 0.18} L${pad * 0.05} ${s * 0.12}`}
              stroke="rgba(147,197,253,0.6)"
              strokeWidth={s * 0.02}
              strokeLinecap="round"
              fill="none"
            >
              <animate attributeName="opacity" values="0;0.8;0.2;0.9;0" dur="1.2s" repeatCount="indefinite" />
            </path>

            {/* Right arc */}
            <path
              d={`M${s - pad * 0.5} ${s * 0.35} L${s - pad * 0.15} ${s * 0.27} L${s - pad * 0.4} ${s * 0.22} L${s - pad * 0.05} ${s * 0.15}`}
              stroke="rgba(165,180,252,0.5)"
              strokeWidth={s * 0.018}
              strokeLinecap="round"
              fill="none"
            >
              <animate attributeName="opacity" values="0.9;0;0.7;0.1;0.8" dur="1.4s" repeatCount="indefinite" />
            </path>

            {/* Bottom arc */}
            <path
              d={`M${s * 0.25} ${s - pad * 0.5} L${s * 0.2} ${s - pad * 0.2} L${s * 0.15} ${s - pad * 0.45} L${s * 0.1} ${s - pad * 0.1}`}
              stroke="rgba(147,197,253,0.4)"
              strokeWidth={s * 0.015}
              strokeLinecap="round"
              fill="none"
            >
              <animate attributeName="opacity" values="0.5;0;0.9;0.3;0.6" dur="1.6s" repeatCount="indefinite" />
            </path>

            {/* Spark particles */}
            <circle cx={s * 0.18} cy={s * 0.2} r={s * 0.02} fill="#93c5fd">
              <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="r" values={`${s * 0.01};${s * 0.025};${s * 0.01}`} dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx={s * 0.82} cy={s * 0.25} r={s * 0.018} fill="#a5b4fc">
              <animate attributeName="opacity" values="1;0;0.8;0;1" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx={s * 0.22} cy={s * 0.82} r={s * 0.015} fill="#93c5fd">
              <animate attributeName="opacity" values="0.3;1;0;0.7;0.3" dur="1.1s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
};

export default KnovaultIcon;
