import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Button,
  List,
  InfiniteScroll,
  DotLoading,
  PullToRefresh,
  Popup,
  Radio,
  Space,
  Tag,
} from 'antd-mobile';
import { HeartOutline, FilterOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useApp';
import { mapService } from '../../utils/map';
import { Toast } from '../../components/Toast';
import HeartEffect from '../../components/HeartEffect';
import {
  setLocation,
  setRestaurants,
  setSelectedRestaurant,
  setLoading,
} from '../../store';
import { Restaurant, Location as MapLocation } from '../../utils/map';
import styles from './index.module.scss';
import Image from '../../components/Image';
import { debounce } from 'lodash';
import lyxzbw1 from '../../assets/lyxzbw1.jpg';
import lyxzbw2 from '../../assets/lyxzbw2.jpg';
import lyxzbw3 from '../../assets/lyxzbw3.jpg';

interface FilterOptions {
  type: string[];
  priceRange: string;
  rating: string;
  sortBy: string;
}

const CUISINE_TYPES = [
  { label: '全部', value: 'all' },
  { label: '中餐', value: 'chinese' },
  { label: '日料', value: 'japanese' },
  { label: '韩餐', value: 'korean' },
  { label: '西餐', value: 'western' },
  { label: '东南亚', value: 'southeast_asian' },
  { label: '快餐', value: 'fast_food' },
];

const PRICE_RANGES = [
  { label: '全部', value: 'all' },
  { label: '¥0-50', value: '0-50' },
  { label: '¥50-100', value: '50-100' },
  { label: '¥100-200', value: '100-200' },
  { label: '¥200+', value: '200+' },
];

const RATING_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '4.5分以上', value: '4.5' },
  { label: '4分以上', value: '4.0' },
  { label: '3.5分以上', value: '3.5' },
];

const SORT_OPTIONS = [
  { label: '综合排序', value: 'default' },
  { label: '距离最近', value: 'distance' },
  { label: '评分最高', value: 'rating' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { location, restaurants, loading } = useAppSelector(
    (state) => state.app
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const initRef = useRef(false);
  const locationRef = useRef(location);
  const [showFilter, setShowFilter] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 修改默认筛选状态，包含"全部"选项
  const defaultFilters: FilterOptions = {
    type: ['all'],
    priceRange: 'all',
    rating: 'all',
    sortBy: 'default',
  };

  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>(defaultFilters);
  const [tempFilterOptions, setTempFilterOptions] =
    useState<FilterOptions>(defaultFilters);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [showHeartEffect, setShowHeartEffect] = useState(false);

  const initMap = async () => {
    try {
      await mapService.init();
      await getCurrentLocation();
    } catch {
      Toast.show({
        content: '地图初始化失败',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      dispatch(setLoading(true));
      const location = await mapService.getCurrentLocation();
      dispatch(setLocation(location));
      // 不在这里加载餐厅数据，由 useEffect 监听 location 变化时加载
    } catch {
      Toast.show({
        content: '获取位置失败，请检查定位权限',
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  // 防抖的搜索处理函数
  const debouncedSearch = useRef(
    debounce((value: string) => {
      setSearchText(value);
      setIsSearching(false);
    }, 500)
  ).current;

  // 处理搜索输入
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIsSearching(true);
    debouncedSearch(value);
  };

  // 使用 useMemo 缓存过滤结果
  const filteredRestaurants = useMemo(() => {
    let result = [...allRestaurants];

    // 彩蛋功能
    if (searchText.trim() === '李语馨') {
      if (!showHeartEffect) {
        setShowHeartEffect(true);
        // 10秒后关闭动效
        setTimeout(() => {
          setShowHeartEffect(false);
        }, 10000);
      }
      return [
        {
          id: 'easter_egg',
          name: '张宝文',
          address: '❤️',
          location: {
            latitude: 0,
            longitude: 0,
            address: '❤️',
          },
          rating: 5,
          distance: 0,
          photos: [lyxzbw1, lyxzbw2, lyxzbw3],
          type: '最爱',
          tel: '',
        },
      ];
    } else if (showHeartEffect) {
      setShowHeartEffect(false);
    }

    // 原有的筛选逻辑
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      result = result.filter((restaurant) => {
        const name = restaurant.name.toLowerCase();
        const address = restaurant.address.toLowerCase();
        return name.includes(searchLower) || address.includes(searchLower);
      });
    }

    // 应用类型筛选
    if (filterOptions.type.length > 0 && !filterOptions.type.includes('all')) {
      result = result.filter((restaurant) =>
        filterOptions.type.some((type) =>
          restaurant.type?.toLowerCase().includes(type)
        )
      );
    }

    // 应用价格区间筛选
    if (filterOptions.priceRange !== 'all') {
      const [min, max] = filterOptions.priceRange.split('-').map(Number);
      result = result.filter((restaurant) => {
        const cost = Number(restaurant.cost);
        if (!cost) return false;
        if (!max) return cost >= min;
        return cost >= min && cost <= max;
      });
    }

    // 应用评分筛选
    if (filterOptions.rating !== 'all') {
      const minRating = Number(filterOptions.rating);
      result = result.filter((restaurant) => restaurant.rating >= minRating);
    }

    // 应用排序
    switch (filterOptions.sortBy) {
      case 'distance':
        result.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // 综合排序：评分 * 1000 / 距离
        result.sort(
          (a, b) =>
            (b.rating * 1000) / b.distance - (a.rating * 1000) / a.distance
        );
    }

    return result;
  }, [allRestaurants, searchText, filterOptions, showHeartEffect]);

  // 更新缓存
  const updateCache = (restaurants: Restaurant[], location: MapLocation) => {
    try {
      localStorage.setItem('restaurants', JSON.stringify(restaurants));
      localStorage.setItem('location', JSON.stringify(location));
      localStorage.setItem('cacheTimestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to update cache:', error);
    }
  };

  // 从缓存加载数据
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cachedRestaurants = localStorage.getItem('restaurants');
        const cachedLocation = localStorage.getItem('location');
        const cachedTimestamp = localStorage.getItem('cacheTimestamp');

        if (cachedRestaurants && cachedLocation && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp);
          // 检查缓存是否在24小时内
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            const restaurants = JSON.parse(cachedRestaurants);
            const location = JSON.parse(cachedLocation);
            dispatch(setRestaurants(restaurants));
            dispatch(setLocation(location));
            setAllRestaurants(restaurants);
            locationRef.current = location;
            return true;
          }
        }
      } catch (error) {
        console.warn('Failed to load from cache:', error);
      }
      return false;
    };

    // 初始化时尝试从缓存加载
    if (!initRef.current && loadFromCache()) {
      setIsInitializing(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    const init = async () => {
      if (!initRef.current) {
        try {
          setIsInitializing(true);
          await initMap();
          initRef.current = true;
        } catch (error) {
          console.error('初始化失败:', error);
          Toast.show({
            content: '初始化失败，请刷新重试',
          });
        } finally {
          setIsInitializing(false);
        }
      }
    };
    init();
  }, []);

  // 监听位置变化
  useEffect(() => {
    if (location && location !== locationRef.current) {
      locationRef.current = location;
      loadRestaurants(1);
    }
  }, [location]);

  const loadRestaurants = async (page: number, isLoadingMore = false) => {
    const currentLocation = locationRef.current;
    if (!currentLocation) return;

    try {
      // 只在非加载更多时设置全局 loading
      if (!isLoadingMore) {
        dispatch(setLoading(true));
      }

      const newRestaurants = await mapService.searchNearbyRestaurants(
        currentLocation,
        page
      );
      if (newRestaurants.length === 0) {
        setHasMore(false);
        return;
      }

      if (page === 1) {
        dispatch(setRestaurants(newRestaurants));
        setAllRestaurants(newRestaurants);
        // 更新缓存
        updateCache(newRestaurants, currentLocation);
      } else {
        const updatedRestaurants = [...allRestaurants, ...newRestaurants];
        dispatch(setRestaurants(updatedRestaurants));
        setAllRestaurants(updatedRestaurants);
        // 更新缓存
        updateCache(updatedRestaurants, currentLocation);
      }
      setCurrentPage(page);
    } catch {
      Toast.show({
        content: '获取餐厅列表失败',
      });
      setHasMore(false);
    } finally {
      if (!isLoadingMore) {
        dispatch(setLoading(false));
      }
    }
  };

  const listWrapperRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = async () => {
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      await loadRestaurants(currentPage + 1, true);
    } finally {
      setIsLoadingMore(false);
    }
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

  const handleRefresh = async () => {
    setCurrentPage(1);
    setHasMore(true);
    await loadRestaurants(1, false);
  };

  const handleFilterConfirm = () => {
    setFilterOptions(tempFilterOptions);
    setShowFilter(false);
  };

  const handleFilterReset = () => {
    setTempFilterOptions(defaultFilters);
    if (!showFilter) {
      // 如果是在主页面点击重置，直接应用重置
      setFilterOptions(defaultFilters);
      setSearchText('');
    }
  };

  const handleShowFilter = () => {
    setTempFilterOptions(filterOptions);
    setShowFilter(true);
  };

  // 清理防抖函数
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  if (!location || (loading && !isSearching) || isInitializing) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <DotLoading />
          <span>{!location ? '定位中...' : '加载中...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {showHeartEffect && <HeartEffect />}
      <div className={styles.header}>
        <h1>美食盲盒</h1>
        <p>让选择更简单</p>
      </div>
      <div className={styles.content}>
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="搜索餐厅名称"
              defaultValue={searchText}
              onChange={handleSearchInput}
            />
          </div>
          <div className={styles.searchFilter} onClick={handleShowFilter}>
            <FilterOutline fontSize={20} />
          </div>
        </div>
        <div className={styles.listWrapper} ref={listWrapperRef}>
          <PullToRefresh
            onRefresh={handleRefresh}
            renderText={(status) => {
              return {
                pulling: '下拉刷新',
                canRelease: '释放立即刷新',
                refreshing: '加载中...',
                complete: '刷新成功',
              }[status];
            }}
          >
            <List className={styles.list}>
              {allRestaurants.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🍽️</div>
                  <p>正在搜索附近的餐厅...</p>
                  <Button color="primary" onClick={() => loadRestaurants(1)}>
                    重新加载
                  </Button>
                </div>
              ) : filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant) => (
                  <List.Item
                    key={restaurant.id}
                    onClick={() => handleRestaurantClick(restaurant)}
                    prefix={
                      <div className={styles.imageWrapper}>
                        <Image
                          src={restaurant.photos?.[0]}
                          alt={restaurant.name}
                          width={64}
                          height={64}
                        />
                      </div>
                    }
                    description={
                      <div className={styles.description}>
                        <span>
                          {restaurant.type?.split(';')[0] || '暂无分类'}
                        </span>
                        <span>•</span>
                        <span>
                          {restaurant.rating
                            ? `${restaurant.rating}分`
                            : '暂无评分'}
                        </span>
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
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>😅</div>
                  <p>没有找到符合条件的餐厅</p>
                  <Button
                    color="primary"
                    onClick={() => {
                      handleFilterReset();
                      if (searchInputRef.current) {
                        searchInputRef.current.value = '';
                      }
                    }}
                  >
                    重置筛选条件
                  </Button>
                </div>
              )}
            </List>
            {filteredRestaurants.length > 0 && !isSearching && (
              <InfiniteScroll
                loadMore={loadMore}
                hasMore={hasMore && !isLoadingMore}
                threshold={250}
              />
            )}
          </PullToRefresh>
        </div>
      </div>
      <Popup
        visible={showFilter}
        onMaskClick={() => setShowFilter(false)}
        position="right"
        bodyStyle={{ width: '80vw' }}
      >
        <div className={styles.filterContainer}>
          <div className={styles.filterScroll}>
            <div className={styles.filterSection}>
              <h3>菜系类型</h3>
              <Space wrap>
                {CUISINE_TYPES.map((option) => (
                  <Tag
                    key={option.value}
                    color={
                      tempFilterOptions.type.includes(option.value)
                        ? 'primary'
                        : 'default'
                    }
                    onClick={() => {
                      const newTypes = tempFilterOptions.type.includes(
                        option.value
                      )
                        ? tempFilterOptions.type.filter(
                            (t) => t !== option.value
                          )
                        : [...tempFilterOptions.type, option.value];
                      setTempFilterOptions((prev) => ({
                        ...prev,
                        type: newTypes,
                      }));
                    }}
                  >
                    {option.label}
                  </Tag>
                ))}
              </Space>
            </div>
            <div className={styles.filterSection}>
              <h3>价格区间</h3>
              <Radio.Group
                value={tempFilterOptions.priceRange}
                onChange={(value) =>
                  setTempFilterOptions((prev) => ({
                    ...prev,
                    priceRange: value.toString(),
                  }))
                }
              >
                <Space direction="vertical" block>
                  {PRICE_RANGES.map((option) => (
                    <Radio key={option.value} value={option.value} block>
                      {option.label}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
            <div className={styles.filterSection}>
              <h3>最低评分</h3>
              <Radio.Group
                value={tempFilterOptions.rating}
                onChange={(value) =>
                  setTempFilterOptions((prev) => ({
                    ...prev,
                    rating: value.toString(),
                  }))
                }
              >
                <Space direction="vertical" block>
                  {RATING_OPTIONS.map((option) => (
                    <Radio key={option.value} value={option.value} block>
                      {option.label}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
            <div className={styles.filterSection}>
              <h3>排序方式</h3>
              <Radio.Group
                value={tempFilterOptions.sortBy}
                onChange={(value) =>
                  setTempFilterOptions((prev) => ({
                    ...prev,
                    sortBy: value.toString(),
                  }))
                }
              >
                <Space direction="vertical" block>
                  {SORT_OPTIONS.map((option) => (
                    <Radio key={option.value} value={option.value} block>
                      {option.label}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          </div>
          <div className={styles.filterActions}>
            <Button block color="default" onClick={handleFilterReset}>
              重置
            </Button>
            <Button block color="primary" onClick={handleFilterConfirm}>
              确定
            </Button>
          </div>
        </div>
      </Popup>
      <div className={styles.footer}>
        <Button
          block
          color="primary"
          size="large"
          onClick={handleRandomClick}
          loading={loading}
        >
          开盲盒
        </Button>
        <div className={styles.favoriteButton}>
          <Button
            block
            color="default"
            size="large"
            onClick={handleFavoriteClick}
          >
            <Space align="center">
              <HeartOutline />
              <span>我的收藏</span>
            </Space>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
