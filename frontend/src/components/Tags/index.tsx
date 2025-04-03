import React from 'react';
import styles from './index.module.scss';

interface TagsProps {
  tags: string[];
  className?: string;
}

const Tags: React.FC<TagsProps> = ({ tags, className }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <span className={`${styles.tags} ${className || ''}`}>
      {tags.map((tag, index) => (
        <span key={index} className={styles.tag}>
          {tag}
        </span>
      ))}
    </span>
  );
};

export default Tags; 
