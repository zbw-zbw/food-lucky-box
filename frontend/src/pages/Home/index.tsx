import React, { useEffect, useRef, useState } from 'react';
import { Button, List, InfiniteScroll, DotLoading } from 'antd-mobile';
import { HeartOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useApp';
import { mapService } from '../../utils/map';
import { Toast } from '../../components/Toast';
import {
  setLocation,
  setRestaurants,
  setSelectedRestaurant,
  setLoading,
} from '../../store';
import { Restaurant } from '../../utils/map';
import styles from './index.module.scss';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { location, restaurants, loading } = useAppSelector((state) => state.app);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initMap();
    }
  }, []);

  const initMap = async () => {
    try {
      await mapService.init();
      await getCurrentLocation();
    } catch {
      Toast.show({
        content: '地图初始化失败',
      });
    }
  };

  const getCurrentLocation = async () => {
    try {
      dispatch(setLoading(true));
      const location = await mapService.getCurrentLocation();
      dispatch(setLocation(location));
    } catch {
      Toast.show({
        content: '获取位置失败，请检查定位权限',
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (location) {
      loadRestaurants(1);
    }
  }, [location]);

  const loadRestaurants = async (page: number) => {
    if (!location) return;
    
    try {
      const newRestaurants = await mapService.searchNearbyRestaurants(location, page);
      if (newRestaurants.length === 0) {
        setHasMore(false);
        return;
      }
      
      if (page === 1) {
        dispatch(setRestaurants(newRestaurants));
      } else {
        dispatch(setRestaurants([...restaurants, ...newRestaurants]));
      }
      setCurrentPage(page);
    } catch {
      Toast.show({
        content: '获取餐厅列表失败',
      });
      setHasMore(false);
    }
  };

  const loadMore = async () => {
    await loadRestaurants(currentPage + 1);
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    dispatch(setSelectedRestaurant(restaurant));
    navigate('/result');
  };

  const handleRandomClick = async () => {
    try {
      dispatch(setLoading(true));
      const randomRestaurant = mapService.getRandomRestaurant(restaurants);
      dispatch(setSelectedRestaurant(randomRestaurant));
      navigate('/result');
    } catch (error) {
      Toast.show({
        content: error instanceof Error ? error.message : '随机推荐失败',
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFavoriteClick = () => {
    navigate('/favorite');
  };

  if (!location || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <DotLoading />
          <span>定位中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>美食盲盒</h1>
        <p>让选择更简单</p>
      </div>
      <div className={styles.content}>
        <div className={styles.listWrapper}>
          <List className={styles.list}>
            {restaurants.map((restaurant) => (
              <List.Item
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant)}
                prefix={
                  <div className={styles.imageWrapper}>
                    <img
                      src={restaurant.photos?.[0]}
                      alt={restaurant.name}
                    />
                  </div>
                }
                description={
                  <div className={styles.description}>
                    <span>{restaurant.type?.split(';')[0] || '暂无分类'}</span>
                    <span>•</span>
                    <span>{restaurant.rating ? `${restaurant.rating}分` : '暂无评分'}</span>
                    {restaurant.cost && (
                      <>
                        <span>•</span>
                        <span>¥{restaurant.cost}/人</span>
                      </>
                    )}
                  </div>
                }
              >
                {restaurant.name}
              </List.Item>
            ))}
          </List>
          <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
        </div>
      </div>
      <div className={styles.footer}>
        <Button
          color="primary"
          block
          onClick={handleRandomClick}
          className={styles.randomButton}
        >
          开盲盒
        </Button>
        <Button
          block
          onClick={handleFavoriteClick}
          className={styles.favoriteButton}
        >
          <HeartOutline fontSize={20} /> 我的收藏
        </Button>
      </div>
    </div>
  );
};

export default Home;
