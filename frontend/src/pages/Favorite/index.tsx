import React from 'react';
import { NavBar, List, Empty } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useApp';
import { setSelectedRestaurant } from '../../store';
import styles from './index.module.scss';
import { Restaurant } from '../../utils/map';

const Favorite: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { favorites } = useAppSelector(state => state.app);

  const handleBack = () => {
    navigate(-1);
  };

  const handleItemClick = (restaurant: Restaurant) => {
    dispatch(setSelectedRestaurant(restaurant));
    navigate('/result', { state: { from: 'favorite' } });
  };

  return (
    <div className={styles.container}>
      <NavBar onBack={handleBack} className={styles.navbar}>
        我的收藏
      </NavBar>
      {favorites.length > 0 ? (
        <List className={styles.list}>
          {favorites.map(restaurant => (
            <List.Item
              key={restaurant.id}
              prefix={
                <div className={styles.imageWrapper}>
                  <img src={restaurant.photos?.[0] || '/placeholder.png'} alt={restaurant.name} />
                </div>
              }
              onClick={() => handleItemClick(restaurant)}
            >
              {restaurant.name}
              <div className={styles.description}>
                <span>{restaurant.type || '暂无分类'}</span>
                <span>•</span>
                <span>{restaurant.rating ? `${restaurant.rating}分` : '暂无评分'}</span>
              </div>
            </List.Item>
          ))}
        </List>
      ) : (
        <div className={styles.empty}>
          <Empty description="暂无收藏" />
        </div>
      )}
    </div>
  );
};

export default Favorite;
