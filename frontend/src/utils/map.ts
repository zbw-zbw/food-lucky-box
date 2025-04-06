import AMapLoader from '@amap/amap-jsapi-loader';
import { retry } from './retry';
import { requestLocationPermission } from './location';

// 扩展全局 Window 接口
declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface AMapInstance {
  [key: string]: unknown;
}

interface AMapGeocoder {
  getAddress(
    location: [number, number],
    callback: (status: string, result: GeocodeResult) => void
  ): void;
}

interface AMapGeolocation {
  getCurrentPosition(
    callback: (status: string, result: GeolocationResult) => void
  ): void;
}

interface GeolocationResult {
  position: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
  status: string;
}

interface AMapPlaceSearch {
  setPageIndex(page: number): void;
  searchNearBy(
    keyword: string,
    location: [number, number],
    radius: number,
    callback: (status: string, result: PlaceSearchResult) => void
  ): void;
}

interface GeocodeResult {
  regeocode: {
    formattedAddress: string;
  };
}

interface PlaceSearchPOI {
  id?: string;
  name?: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  rating?: string;
  distance?: string;
  photos?: Array<{ url?: string }>;
  type?: string;
  tel?: string;
  cost?: string;
}

interface PlaceSearchResult {
  poiList?: {
    pois: PlaceSearchPOI[];
  };
}

// 缓存相关接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
  lastAccessed: number; // 最后访问时间，用于 LRU
}

interface SearchCache {
  [key: string]: CacheItem<Restaurant[]>;
}

const CACHE_CONFIG = {
  maxSize: 200, // 增加最大缓存数量到 200 条
  expiry: 1000 * 60 * 60 * 24, // 延长缓存时间到 24 小时
  storageKey: 'food-lucky-box-search-cache',
  cleanupInterval: 1000 * 60 * 30, // 每 30 分钟清理一次过期缓存
};

// 高德地图配置
const AMAP_CONFIG = {
  key: '3b2500b66b336c23d9884e6e8e495df3',
  securityJsCode: '11b6ce295c7bd3952999f43bde5d41d5',
  serviceHost: 'https://webapi.amap.com',
  searchRadius: 2000, // 增加搜索半径到 2 公里
  pageSize: 50, // 每页结果数
};

// 设置安全密钥配置
window._AMapSecurityConfig = {
  securityJsCode: AMAP_CONFIG.securityJsCode,
};

// OpenStreetMap 配置
const OSM_CONFIG = {
  overpassEndpoint: 'https://overpass-api.de/api/interpreter',
  defaultRadius: 2000, // 增加搜索半径到 2 公里
  timeout: 30, // 增加超时时间到 30 秒
  retryCount: 3, // 添加重试次数
  retryDelay: 1000, // 重试延迟（毫秒）
};

interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    cuisine?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
  };
}

interface OSMResponse {
  elements: OSMNode[];
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  rating: number;
  distance: number;
  photos: string[];
  type: string;
  tel: string;
  cost?: string;
}

export class MapService {
  private static instance: MapService;
  private map: AMapInstance | null = null;
  private geocoder: AMapGeocoder | null = null;
  private placeSearch: AMapPlaceSearch | null = null;
  private geolocation: AMapGeolocation | null = null;
  private isLocating = false;
  private searchCache: SearchCache = {};
  private cleanupTimer: number | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.loadCacheFromStorage();
    this.startCleanupTimer();
  }

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  public async init() {
    // 如果已经初始化完成，直接返回
    if (this.map) return;

    // 如果正在初始化，返回现有的 Promise
    if (this.initPromise) return this.initPromise;

    // 开始新的初始化
    this.initPromise = new Promise((resolve, reject) => {
      AMapLoader.load({
        key: AMAP_CONFIG.key,
        version: '2.0',
        plugins: ['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.Geolocation'],
      })
        .then((AMap) => {
          console.log('开始初始化高德地图...');
          
          this.map = new AMap.Map('container', {
            zoom: 15,
          });

          this.geocoder = new AMap.Geocoder({
            extensions: 'all',
          });

          this.placeSearch = new AMap.PlaceSearch({
            pageSize: 50,
            pageIndex: 1,
            city: '全国',
            extensions: 'all',
          });

          if (AMap.Geolocation) {
            this.geolocation = new AMap.Geolocation({
              enableHighAccuracy: true,
              timeout: 10000,
              zoomToAccuracy: true,
              extensions: 'all',
            });
          }

          console.log('高德地图初始化完成');
          resolve();
        })
        .catch((error) => {
          this.initPromise = null;
          reject(error);
        });
    });

    return this.initPromise;
  }

  public async getCurrentLocation(): Promise<Location> {
    return new Promise(async (resolve, reject) => {
      if (this.isLocating) {
        console.log('定位正在进行中，请等待...');
        return;
      }

      this.isLocating = true;
      console.log('开始获取位置信息...');

      try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          throw new Error('未获得位置权限');
        }

        if (this.geolocation) {
          console.log('使用高德地图定位...');
          const result = await retry(
            () =>
              new Promise<GeolocationResult>((resolve, reject) => {
                this.geolocation?.getCurrentPosition((status, result) => {
                  if (status === 'complete') {
                    resolve(result);
                  } else {
                    reject(new Error('高德地图定位失败'));
                  }
                });
              }),
            {
              maxAttempts: 3,
              delay: 1000,
              shouldRetry: (error) => error.message !== '未获得位置权限',
            }
          );

          const { position, formattedAddress } = result;
          console.log('高德地图定位成功:', result);
          this.isLocating = false;
          resolve({
            latitude: position.lat,
            longitude: position.lng,
            address: formattedAddress,
          });
        } else {
          console.log('高德地图定位不可用，尝试浏览器定位...');
          this.tryBrowserGeolocation(resolve, reject);
        }
      } catch (error) {
        console.error('获取位置失败:', error);
        this.isLocating = false;
        reject(error);
      }
    });
  }

  private tryBrowserGeolocation(
    resolve: (location: Location) => void,
    reject: (error: Error) => void
  ) {
    if (!navigator.geolocation) {
      this.isLocating = false;
      console.error('浏览器不支持地理定位');
      reject(new Error('浏览器不支持地理定位'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('浏览器定位成功:', position);
        const { latitude, longitude } = position.coords;
        try {
          const address = await this.getAddress(latitude, longitude);
          this.isLocating = false;
          resolve({ latitude, longitude, address });
        } catch (error) {
          this.isLocating = false;
          console.error('获取地址失败:', error);
          reject(new Error('获取地址失败'));
        }
      },
      (error) => {
        this.isLocating = false;
        console.error('浏览器定位失败:', error);
        reject(new Error(error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  public async getAddress(
    latitude: number,
    longitude: number
  ): Promise<string> {
    if (!this.geocoder) {
      throw new Error('地图服务未初始化');
    }

    return new Promise((resolve, reject) => {
      console.log('开始获取地址信息...');
      this.geocoder?.getAddress(
        [longitude, latitude],
        (status: string, result: GeocodeResult) => {
          if (status === 'complete' && result.regeocode) {
            console.log('获取地址成功:', result);
            resolve(result.regeocode.formattedAddress);
          } else {
            console.error('获取地址失败:', status, result);
            reject(new Error('获取地址失败'));
          }
        }
      );
    });
  }

  // 从 localStorage 加载缓存
  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem(CACHE_CONFIG.storageKey);
      if (cached) {
        this.searchCache = JSON.parse(cached);
        // 清理过期缓存
        this.cleanExpiredCache();
      }
    } catch (error) {
      console.error('加载缓存失败:', error);
      this.searchCache = {};
    }
  }

  // 保存缓存到 localStorage
  private saveCacheToStorage(): void {
    try {
      localStorage.setItem(
        CACHE_CONFIG.storageKey,
        JSON.stringify(this.searchCache)
      );
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  }

  // 清理过期缓存
  private cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys = Object.keys(this.searchCache).filter(
      (key) => now - this.searchCache[key].timestamp > CACHE_CONFIG.expiry
    );
    expiredKeys.forEach((key) => delete this.searchCache[key]);
  }

  // 实现 LRU 策略
  private enforceCacheSize(): void {
    const keys = Object.keys(this.searchCache);
    if (keys.length <= CACHE_CONFIG.maxSize) return;

    // 按最后访问时间排序
    const sortedKeys = keys.sort(
      (a, b) =>
        this.searchCache[a].lastAccessed - this.searchCache[b].lastAccessed
    );

    // 删除最旧的缓存
    const keysToRemove = sortedKeys.slice(0, keys.length - CACHE_CONFIG.maxSize);
    keysToRemove.forEach((key) => delete this.searchCache[key]);
  }

  private getCacheKey(location: Location, page: number): string {
    return `${location.latitude},${location.longitude},${page}`;
  }

  private getFromCache(key: string): Restaurant[] | null {
    const cached = this.searchCache[key];
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > CACHE_CONFIG.expiry) {
      delete this.searchCache[key];
      this.saveCacheToStorage();
      return null;
    }

    // 更新最后访问时间
    cached.lastAccessed = now;
    this.saveCacheToStorage();
    return cached.data;
  }

  private setCache(key: string, data: Restaurant[]): void {
    this.searchCache[key] = {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
    };

    // 清理过期缓存并强制执行大小限制
    this.cleanExpiredCache();
    this.enforceCacheSize();
    this.saveCacheToStorage();
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      window.clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupExpiredCache();
    }, CACHE_CONFIG.cleanupInterval);
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys = Object.keys(this.searchCache).filter(
      (key) => now - this.searchCache[key].timestamp > CACHE_CONFIG.expiry
    );
    if (expiredKeys.length > 0) {
      expiredKeys.forEach((key) => delete this.searchCache[key]);
      this.saveCacheToStorage();
      console.log(`清理了 ${expiredKeys.length} 条过期缓存`);
    }
  }

  // 使用 OpenStreetMap 搜索餐厅
  private async searchOSMRestaurants(
    location: Location,
    page: number = 1
  ): Promise<Restaurant[]> {
    const { latitude, longitude } = location;
    const radius = OSM_CONFIG.defaultRadius;
    const offset = (page - 1) * AMAP_CONFIG.pageSize;
    const limit = AMAP_CONFIG.pageSize;

    // 构建 Overpass QL 查询
    const query = `
      [out:json][timeout:${OSM_CONFIG.timeout}];
      (
        node["amenity"="restaurant"](around:${radius},${latitude},${longitude});
        way["amenity"="restaurant"](around:${radius},${latitude},${longitude});
        relation["amenity"="restaurant"](around:${radius},${latitude},${longitude});
      );
      out body;
      >;
      out skel qt;
    `;

    for (let attempt = 0; attempt < OSM_CONFIG.retryCount; attempt++) {
      try {
        const response = await fetch(OSM_CONFIG.overpassEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
          throw new Error('OSM API 请求失败');
        }

        const data: OSMResponse = await response.json();
        
        // 转换 OSM 数据为餐厅格式
        const restaurants = data.elements
          .filter((node) => node.tags && node.tags.name)
          .map((node) => ({
            id: `osm_${node.id}`,
            name: node.tags.name || '',
            address: this.formatOSMAddress(node.tags),
            location: {
              latitude: node.lat,
              longitude: node.lon,
              address: this.formatOSMAddress(node.tags),
            },
            rating: 0,
            distance: this.calculateDistance(
              latitude,
              longitude,
              node.lat,
              node.lon
            ),
            photos: [],
            type: node.tags.cuisine || '未知类型',
            tel: node.tags.phone || '',
            cost: undefined,
          }));

        // 按距离排序并分页
        return restaurants
          .sort((a, b) => a.distance - b.distance)
          .slice(offset, offset + limit);
      } catch (error) {
        console.error(`OSM 搜索失败 (尝试 ${attempt + 1}/${OSM_CONFIG.retryCount}):`, error);
        if (attempt === OSM_CONFIG.retryCount - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, OSM_CONFIG.retryDelay));
      }
    }

    throw new Error('OSM 搜索失败，已达到最大重试次数');
  }

  // 格式化 OSM 地址
  private formatOSMAddress(tags: OSMNode['tags']): string {
    const parts = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:city'],
    ].filter(Boolean);
    return parts.join(' ') || '地址未知';
  }

  // 计算两点之间的距离（米）
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // 修改搜索方法以支持多个数据源
  public async searchNearbyRestaurants(
    location: Location,
    page: number = 1
  ): Promise<Restaurant[]> {
    const cacheKey = this.getCacheKey(location, page);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('使用缓存的餐厅数据');
      return cached;
    }

    let restaurants: Restaurant[] = [];
    
    // 只尝试一种数据源
    if (this.placeSearch) {
      try {
        restaurants = await this.searchAMapRestaurants(location, page);
      } catch (error) {
        console.warn('高德地图搜索失败，尝试使用 OSM:', error);
        restaurants = await this.searchOSMRestaurants(location, page);
      }
    } else {
      restaurants = await this.searchOSMRestaurants(location, page);
    }

    this.setCache(cacheKey, restaurants);
    return restaurants;
  }

  // 将原来的高德地图搜索逻辑移到单独的方法
  private async searchAMapRestaurants(
    location: Location,
    page: number = 1
  ): Promise<Restaurant[]> {
    if (!this.placeSearch) {
      throw new Error('地图服务未初始化');
    }

    return new Promise((resolve, reject) => {
      console.log('开始搜索附近餐厅...');
      this.placeSearch?.setPageIndex(page);
      this.placeSearch?.searchNearBy(
        '美食',
        [location.longitude, location.latitude],
        1000,
        (status: string, result: PlaceSearchResult) => {
          if (status === 'complete' && result.poiList) {
            console.log('搜索餐厅成功:', result);
            try {
              const restaurants = result.poiList.pois.map((poi) => ({
                id: poi.id || '',
                name: poi.name || '',
                address: poi.address || '',
                location: {
                  latitude: poi.location?.lat || 0,
                  longitude: poi.location?.lng || 0,
                  address: poi.address || '',
                },
                rating: Number(poi.rating) || 0,
                distance: Number(poi.distance) || 0,
                photos: Array.isArray(poi.photos)
                  ? poi.photos.map((photo) => photo.url || '').filter(Boolean)
                  : [],
                type: poi.type || '',
                tel: poi.tel || '',
                cost: poi.cost || undefined,
              }));
              resolve(restaurants);
            } catch (error) {
              console.error('处理餐厅数据失败:', error);
              reject(new Error('处理餐厅数据失败'));
            }
          } else {
            console.error('搜索餐厅失败:', status, result);
            reject(new Error('搜索餐厅失败'));
          }
        }
      );
    });
  }

  public getRandomRestaurant(
    restaurants: Restaurant[],
    excludeId?: string
  ): Restaurant {
    const availableRestaurants = excludeId
      ? restaurants.filter((r) => r.id !== excludeId)
      : restaurants;

    if (availableRestaurants.length === 0) {
      throw new Error('没有可用的餐厅');
    }

    const randomIndex = Math.floor(Math.random() * availableRestaurants.length);
    return availableRestaurants[randomIndex];
  }

  // 添加清除缓存方法
  public clearCache(): void {
    this.searchCache = {};
    this.saveCacheToStorage();
    console.log('已清除所有餐厅缓存');
  }
}

export const mapService = MapService.getInstance();
