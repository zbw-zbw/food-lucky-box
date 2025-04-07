import React from 'react';
import { Button, Card, Swiper, NavBar } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useApp';
import { mapService } from '../../utils/map';
import { Toast } from '../../components/Toast';
import FavoriteButton from '../../components/FavoriteButton';
import Rating from '../../components/Rating';
import Tags from '../../components/Tags';
import {
  setSelectedRestaurant,
  setLoading,
  addToFavorites,
  removeFromFavorites,
} from '../../store';
import styles from './index.module.scss';

const Result: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { selectedRestaurant, restaurants, loading, favorites } = useAppSelector(
    state => state.app
  );
  const isFromFavorite = location.state?.from === 'favorite';

  const isFavorite = selectedRestaurant
    ? favorites.some(item => item.id === selectedRestaurant.id)
    : false;

  const handleRandom = async () => {
    try {
      dispatch(setLoading(true));
      const randomRestaurant = mapService.getRandomRestaurant(restaurants, selectedRestaurant?.id);
      dispatch(setSelectedRestaurant(randomRestaurant));
    } catch (error) {
      Toast.show({
        content: error instanceof Error ? error.message : '随机推荐失败',
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleFavorite = () => {
    if (!selectedRestaurant) return;

    if (isFavorite) {
      dispatch(removeFromFavorites(selectedRestaurant.id));
      Toast.show({
        content: '已取消收藏',
      });
    } else {
      dispatch(addToFavorites(selectedRestaurant));
      Toast.show({
        content: '已添加到收藏',
      });
    }
  };

  const handleNextFavorite = () => {
    if (!selectedRestaurant || favorites.length <= 1) return;

    const currentIndex = favorites.findIndex(item => item.id === selectedRestaurant.id);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % favorites.length;
    dispatch(setSelectedRestaurant(favorites[nextIndex]));
  };

  const handlePrevFavorite = () => {
    if (!selectedRestaurant || favorites.length <= 1) return;

    const currentIndex = favorites.findIndex(item => item.id === selectedRestaurant.id);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + favorites.length) % favorites.length;
    dispatch(setSelectedRestaurant(favorites[prevIndex]));
  };

  if (!selectedRestaurant) {
    return (
      <div className={styles.container}>
        <NavBar onBack={handleBack} className={styles.navbar}>
          餐厅详情
        </NavBar>
        <Card className={styles.resultCard}>
          <div className={styles.restaurantInfo}>
            <h2>未找到餐厅信息</h2>
          </div>
        </Card>
        <div className={styles.actions}>
          <Button color="primary" block onClick={handleBack}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const formatDistance = (distance: number) => {
    return distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${Math.round(distance)}m`;
  };

  const formatPhoneNumbers = (tel: string) => {
    // 只使用分号分隔
    return tel
      .split(';')
      .filter(Boolean)
      .map(num => num.trim());
  };

  const formatTypes = (type: string) => {
    // 分割并去重
    return Array.from(new Set(type.split(';'))).filter(Boolean);
  };

  return (
    <div className={styles.container}>
      <NavBar onBack={handleBack} className={styles.navbar}>
        餐厅详情
      </NavBar>
      <div className={styles.content}>
        <Card className={styles.resultCard}>
          <div className={styles.restaurantInfo}>
            <div className={styles.header}>
              <div className={styles.titleWrapper}>
                <h2>{selectedRestaurant.name}</h2>
                <span className={styles.cost}>
                  {selectedRestaurant.cost ? `¥${selectedRestaurant.cost}/人` : '暂无价格'}
                </span>
              </div>
              <FavoriteButton
                type="icon"
                isFavorite={isFavorite}
                onFavorite={handleFavorite}
                className={styles.favoriteButton}
              />
            </div>
            {selectedRestaurant.photos && selectedRestaurant.photos.length > 0 && (
              <div className={styles.photos}>
                <Swiper
                  autoplay
                  loop
                  indicator={selectedRestaurant.photos.length > 1 ? undefined : false}
                >
                  {selectedRestaurant.photos.map((photo, index) => (
                    <Swiper.Item key={index}>
                      <div className={styles.photoItem}>
                        <img src={photo} alt={`${selectedRestaurant.name}-${index + 1}`} />
                      </div>
                    </Swiper.Item>
                  ))}
                </Swiper>
              </div>
            )}
            <div className={styles.details}>
              <div className={styles.row}>
                <span className={styles.label}>评分</span>
                <Rating value={selectedRestaurant.rating} />
              </div>
              <div className={styles.row}>
                <span className={styles.label}>类型</span>
                <Tags tags={selectedRestaurant.type ? formatTypes(selectedRestaurant.type) : []} />
              </div>
              <div className={styles.row}>
                <span className={styles.label}>距离</span>
                <span className={styles.value}>{formatDistance(selectedRestaurant.distance)}</span>
              </div>
              <div className={styles.row}>
                <span className={styles.label}>地址</span>
                <span className={styles.value}>{selectedRestaurant.address}</span>
              </div>
              {selectedRestaurant.tel && (
                <div className={styles.row}>
                  <span className={styles.label}>电话</span>
                  <Tags
                    tags={formatPhoneNumbers(selectedRestaurant.tel)}
                    className={styles.telTags}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
        <div className={styles.actions}>
          {isFromFavorite ? (
            favorites.length > 1 && (
              <div className={styles.favoriteActions}>
                <Button color="primary" onClick={handlePrevFavorite} className={styles.prevButton}>
                  上一家
                </Button>
                <Button color="primary" onClick={handleNextFavorite} className={styles.nextButton}>
                  下一家
                </Button>
              </div>
            )
          ) : (
            <>
              <Button color="primary" block loading={loading} onClick={handleRandom}>
                换一家
              </Button>
              <FavoriteButton />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Result;
