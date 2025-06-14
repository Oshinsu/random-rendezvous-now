
import React from 'react';

interface RandomLogoProps {
  size?: number;
  withAura?: boolean;
  className?: string;
  // withTitle : utile pour le menu principal
  withTitle?: boolean;
  rounded?: boolean;
}

const LOGO_URL = 'https://i.postimg.cc/yx7LxJWf/oshinsu-R-logo-gold-and-white-Random-magic-social-app-ultra-f-ff15989e-0ffa-4a53-bd2e-ca881784b940-0.png';

const RandomLogo: React.FC<RandomLogoProps> = ({
  size = 48,
  withAura = false,
  className = '',
  withTitle = false,
  rounded = true,
}) => (
  <span className={`inline-flex items-center gap-3 ${className}`}>
    <span
      className={`relative`}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        borderRadius: rounded ? '20%' : undefined,
        overflow: 'hidden',
        boxShadow: withAura
          ? '0 0 28px 10px rgba(241,194,50,0.22), 0 0 6px 2px rgba(255,255,255,0.28)'
          : undefined,
        background: 'linear-gradient(135deg,#f1c232 0%,#fff0 50%,#fff 100%)',
      }}
    >
      <img
        src={LOGO_URL}
        alt="Random Logo"
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          borderRadius: rounded ? '20%' : undefined,
          display: 'block',
        }}
      />
    </span>
    {withTitle && (
      <span
        className="font-display font-bold text-2xl bg-gradient-to-r from-amber-400 via-amber-600 to-yellow-900 bg-clip-text text-transparent drop-shadow-glow-gold"
        style={{
          letterSpacing: '0.03em',
          filter: 'drop-shadow(0 1px 6px #ffe7b244)',
        }}
      >
        Random
      </span>
    )}
  </span>
);

export default RandomLogo;
