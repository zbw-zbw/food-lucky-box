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
      
      // 随机位置和动画
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.animationDuration = (Math.random() * 2 + 3) + 's'; // 3-5秒
      heart.style.opacity = (Math.random() * 0.3 + 0.7).toString(); // 0.7-1
      
      // 随机大小
      const scale = Math.random() * 1.5 + 1; // 1-2.5倍大小
      heart.style.transform = `scale(${scale})`;
      
      container.appendChild(heart);

      // 动画结束后移除
      setTimeout(() => {
        heart.remove();
      }, 5000);
    };

    // 初始创建一批爱心
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        createHeart();
      }, i * 100);
    }

    // 持续创建爱心
    const interval = setInterval(() => {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          createHeart();
        }, i * 150);
      }
    }, 400);

    return () => {
      clearInterval(interval);
      container.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className={styles.container} />;
};

export default HeartEffect; 
