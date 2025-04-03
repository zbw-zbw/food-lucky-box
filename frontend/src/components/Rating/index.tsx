import React from 'react';
import { StarFill, StarOutline } from 'antd-mobile-icons';
import styles from './index.module.scss';

interface RatingProps {
  value?: number;
  className?: string;
}

const Rating: React.FC<RatingProps> = ({ value = 0, className }) => {
  const stars = Array(5).fill(0);
  // 保持原始评分（满分5分）
  const rating = value ? value : 0;
  
  return (
    <span className={`${styles.rating} ${className || ''}`}>
      {stars.map((_, index) => {
        const starValue = index + 1;
        // 完整星星
        if (starValue <= Math.floor(rating)) {
          return (
            <span key={index} className={styles.star}>
              <StarFill color="#ffd700" fontSize={16} />
            </span>
          );
        }
        // 半星
        if (starValue - 0.5 <= rating) {
          return (
            <span key={index} className={styles.star}>
              <StarFill
                color="#ffd700"
                fontSize={16}
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
              <StarOutline
                color="#999"
                fontSize={16}
                style={{ position: 'absolute' }}
              />
            </span>
          );
        }
        // 空星
        return (
          <span key={index} className={styles.star}>
            <StarOutline color="#999" fontSize={16} />
          </span>
        );
      })}
      {value ? (
        <span className={styles.score}>{value.toFixed(1)}分</span>
      ) : null}
    </span>
  );
};

export default Rating;
