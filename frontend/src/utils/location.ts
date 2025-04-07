import { Toast } from '../components/Toast';

export enum LocationPermission {
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'promt',
}

export const checkLocationPermission = async (): Promise<LocationPermission> => {
  if (!navigator.permissions) {
    return LocationPermission.PROMPT;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state as LocationPermission;
  } catch {
    return LocationPermission.PROMPT;
  }
};

export const requestLocationPermission = async (): Promise<boolean> => {
  const permission = await checkLocationPermission();

  if (permission === LocationPermission.GRANTED) {
    return true;
  }

  if (permission === LocationPermission.DENIED) {
    Toast.show({
      content: '需要位置权限才能使用此功能，请在浏览器设置中开启位置权限',
    });
    return false;
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          Toast.show({
            content: '需要位置权限才能使用此功能，请在浏览器设置中开启位置权限',
          });
        } else {
          Toast.show({
            content: '获取位置失败，请检查定位服务是否开启',
          });
        }
        resolve(false);
      },
      { timeout: 5000 }
    );
  });
};
