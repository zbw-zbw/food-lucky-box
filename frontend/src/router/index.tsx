import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Result from '../pages/Result';
import Favorite from '../pages/Favorite';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/result',
    element: <Result />,
  },
  {
    path: '/favorite',
    element: <Favorite />,
  },
]);

export default router; 
