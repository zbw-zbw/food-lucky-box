import AMapLoader from '@amap/amap-jsapi-loader';

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

// 高德地图配置
const AMAP_CONFIG = {
  key: '3b2500b66b336c23d9884e6e8e495df3', // 你的 API Key
  securityJsCode: '11b6ce295c7bd3952999f43bde5d41d5', // 你的安全密钥
  serviceHost: 'https://webapi.amap.com', // 高德地图 API 服务域名
};

// 设置安全密钥配置
window._AMapSecurityConfig = {
  securityJsCode: AMAP_CONFIG.securityJsCode,
};

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

  private constructor() {}

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  public async init() {
    if (this.map) return;

    try {
      console.log('开始初始化高德地图...');
      const AMap = await AMapLoader.load({
        key: AMAP_CONFIG.key,
        version: '2.0',
        plugins: ['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.Geolocation'],
      });

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

      console.log('高德地图初始化成功');
    } catch (error) {
      console.error('高德地图加载失败:', error);
      throw error;
    }
  }

  public async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (this.isLocating) {
        console.log('定位正在进行中，请等待...');
        return;
      }

      this.isLocating = true;
      console.log('开始获取位置信息...');

      if (this.geolocation) {
        console.log('使用高德地图定位...');
        this.geolocation.getCurrentPosition(
          (status: string, result: GeolocationResult) => {
            if (status === 'complete') {
              const { position, formattedAddress } = result;
              console.log('高德地图定位成功:', result);
              this.isLocating = false;
              resolve({
                latitude: position.lat,
                longitude: position.lng,
                address: formattedAddress,
              });
            } else {
              console.log('高德地图定位失败，尝试浏览器定位...');
              this.tryBrowserGeolocation(resolve, reject);
            }
          }
        );
      } else {
        console.log('高德地图定位不可用，尝试浏览器定位...');
        this.tryBrowserGeolocation(resolve, reject);
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

  public async searchNearbyRestaurants(
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
        // [location.longitude, location.latitude],
        // FIXME 本地测试
        [113.233777, 22.992968],
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
}

export const mapService = MapService.getInstance();
