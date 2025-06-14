
import React from 'react';

interface RandomLogoProps {
  size?: number;
  withAura?: boolean;
  className?: string;
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
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <span
      className={`relative`}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        borderRadius: rounded ? '20%' : undefined,
        overflow: 'hidden',
        boxShadow: withAura
          ? '0 0 18px 4px rgba(241,194,50,0.16), 0 0 2px 1px rgba(255,255,255,0.10)'
          : undefined,
        // Flat (no gradient)
        background: '#fffbe8',
        border: '1.5px solid #f1c23255',
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
        className="font-playfair font-bold text-3xl bg-clip-text text-[#c8a42d] drop-shadow-glow-gold"
        style={{
          letterSpacing: '0.01em',
          filter: 'drop-shadow(0 1px 6px #ffd70040)',
        }}
      >
        Random
      </span>
    )}
  </span>
);

export default RandomLogo;
