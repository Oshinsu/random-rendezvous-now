
import React from 'react';
import { motion } from 'framer-motion';

interface RandomLogoProps {
  size?: number;
  withAura?: boolean;
  className?: string;
  withTitle?: boolean;
  rounded?: boolean;
  animated?: boolean;
}

const LOGO_URL = 'https://i.postimg.cc/yx7LxJWf/oshinsu-R-logo-gold-and-white-Random-magic-social-app-ultra-f-ff15989e-0ffa-4a53-bd2e-ca881784b940-0.png';

const RandomLogo: React.FC<RandomLogoProps> = ({
  size = 48,
  withAura = false,
  className = '',
  withTitle = false,
  rounded = true,
  animated = true,
}) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <motion.span
      className="relative inline-block"
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? '20%' : undefined,
        overflow: 'hidden',
        background: '#fffbe8',
        border: '1.5px solid #f1c23255',
      }}
      animate={animated ? { rotate: 360 } : {}}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
      whileHover={animated ? {
        rotate: 360,
        scale: 1.1,
        boxShadow: '0 0 24px 6px rgba(241,194,50,0.4), 0 0 4px 2px rgba(255,255,255,0.2)',
        transition: { 
          rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
          scale: { duration: 0.3 },
          boxShadow: { duration: 0.3 }
        }
      } : {}}
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
    </motion.span>
    {withTitle && (
      <motion.span
        className="font-signature text-4xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent tracking-tight"
        style={{
          letterSpacing: '-0.02em',
          textShadow: '0 1px 3px rgba(241, 194, 50, 0.2)',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        Random
      </motion.span>
    )}
  </span>
);

export default RandomLogo;
