import React from 'react';
import { Button } from 'antd-mobile';
import { HeartOutline, HeartFill } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';

interface FavoriteButtonProps {
  type?: 'icon' | 'button';
  isFavorite?: boolean;
  onFavorite?: () => void;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  type = 'button',
  isFavorite = false,
  onFavorite,
  className,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (type === 'icon' && onFavorite) {
      onFavorite();
    } else {
      navigate('/favorite');
    }
  };

  if (type === 'icon') {
    return (
      <div className={`${styles.iconButton} ${className || ''}`} onClick={handleClick}>
        {isFavorite ? (
          <HeartFill color="#ff4d4f" fontSize={24} />
        ) : (
          <HeartOutline color="#999" fontSize={24} />
        )}
      </div>
    );
  }

  return (
    <Button block className={`${styles.button} ${className || ''}`} onClick={handleClick}>
      <HeartOutline fontSize={20} className={styles.icon} />
      我的收藏
    </Button>
  );
};

export default FavoriteButton;
