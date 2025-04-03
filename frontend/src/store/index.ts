import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Restaurant, Location } from '../utils/map';

interface AppState {
  location: Location | null;
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  loading: boolean;
  favorites: Restaurant[];
}

const STORAGE_KEY = 'food-lucky-box';

// 从本地存储加载收藏数据
const loadFavorites = (): Restaurant[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data).favorites || [] : [];
  } catch {
    return [];
  }
};

// 从 localStorage 加载状态
const loadState = (): Partial<AppState> | undefined => {
  try {
    const serializedState = localStorage.getItem('appState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch {
    return undefined;
  }
};

// 保存状态到 localStorage
const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify({
      selectedRestaurant: state.selectedRestaurant,
      favorites: state.favorites,
    });
    localStorage.setItem('appState', serializedState);
  } catch {
    // 忽略写入错误
  }
};

const initialState: AppState = {
  location: null,
  restaurants: [],
  selectedRestaurant: null,
  loading: false,
  favorites: loadFavorites(),
  ...loadState(),
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLocation: (state, action: PayloadAction<Location>) => {
      state.location = action.payload;
    },
    setRestaurants: (state, action: PayloadAction<Restaurant[]>) => {
      state.restaurants = action.payload;
    },
    setSelectedRestaurant: (state, action: PayloadAction<Restaurant>) => {
      state.selectedRestaurant = action.payload;
      saveState(state);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    addToFavorites: (state, action: PayloadAction<Restaurant>) => {
      if (!state.favorites.some((item) => item.id === action.payload.id)) {
        state.favorites.push(action.payload);
        // 保存到本地存储
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          favorites: state.favorites,
        }));
        saveState(state);
      }
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(
        (item) => item.id !== action.payload
      );
      // 保存到本地存储
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        favorites: state.favorites,
      }));
      saveState(state);
    },
  },
});

export const {
  setLocation,
  setRestaurants,
  setSelectedRestaurant,
  setLoading,
  addToFavorites,
  removeFromFavorites,
} = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
