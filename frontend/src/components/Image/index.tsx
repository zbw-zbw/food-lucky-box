import React, { useState } from 'react';
import { Skeleton } from 'antd-mobile';
import styles from './index.module.scss';

interface ImageProps {
  src?: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

const Image: React.FC<ImageProps> = ({ src, alt = '', className = '', width, height }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div className={`${styles.imageWrapper} ${className}`} style={{ width, height }}>
      {loading && <Skeleton animated className={styles.skeleton} />}
      {error ? (
        <div className={styles.placeholder}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={styles.image}
        />
      )}
    </div>
  );
};

export default Image;
