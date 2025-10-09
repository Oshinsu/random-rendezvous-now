import { useEffect, useState } from 'react';
import { useThrottledCallback } from '@/utils/performanceOptimizer';

const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollProgress = () => {
    const scrollPx = document.documentElement.scrollTop;
    const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollPx / winHeightPx) * 100;
    setScrollProgress(scrolled);
  };

  const throttledUpdate = useThrottledCallback(updateScrollProgress, 16); // ~60fps

  useEffect(() => {
    window.addEventListener('scroll', throttledUpdate);
    return () => window.removeEventListener('scroll', throttledUpdate);
  }, [throttledUpdate]);

  return (
    <div
      className="scroll-progress"
      style={{
        transform: `scaleX(${scrollProgress / 100})`,
      }}
    />
  );
};

export default ScrollProgressBar;
