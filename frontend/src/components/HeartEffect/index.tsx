import React, { useEffect, useRef } from 'react';
import styles from './index.module.scss';

const HeartEffect: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createHeart = () => {
      const heart = document.createElement('div');
      heart.className = styles.heart;
      
      // 随机位置
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.animationDuration = (Math.random() * 3 + 2) + 's'; // 2-5秒
      heart.style.opacity = (Math.random() * 0.5 + 0.5).toString(); // 0.5-1
      
      container.appendChild(heart);

      // 动画结束后移除
      setTimeout(() => {
        heart.remove();
      }, 5000);
    };

    // 创建多个心形
    const interval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        createHeart();
      }
    }, 300);

    return () => {
      clearInterval(interval);
      container.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className={styles.container} />;
};

export default HeartEffect; 
