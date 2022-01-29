import { BrowserRouter, useRoutes } from 'react-router-dom';
import WallEditor from './components/WallEditor';
import Home from './routes/Home';
import styles from './App.module.css';
import SideBar from './components/SideBar';

const AppRoutes = () => useRoutes([
  { path: '/', element: <Home /> },
  { path: '/home', element: <Home /> },
  { path: '/wall/:wallID', element: <WallEditor /> },
]);

function App() {
  return (
    <BrowserRouter>
      <div className={styles.container}>
        <div className={styles.mainStrip}>
          <SideBar />
          <AppRoutes />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
