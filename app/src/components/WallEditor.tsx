import { useEffect, useState } from 'react';
import Wall from '../features/wall/Wall';
import styles from './WallEditor.module.css';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  clearEditingPixel,
  setPixel,
  setWall,
  setWallStatus,
} from '../features/wall/wallSlice';
import PixelEditor from './PixelEditor';
import useServerURI from '../hooks/useServerURI';
import useSocket from '../hooks/useSocket';
import { LocalPixel, Wall as WallType } from '../types';

function WallEditor() {
  const dispatch = useAppDispatch();
  const wallSelector = useAppSelector((state) => state.wall);
  const color = '#000000';

  // convert to useSocket
  const [socket, setSocket] = useSocket();

  type StatusText = 'Loading' | 'Editing' | 'Saving' | 'Error Loading';

  const [statusText, setStatusText] = useState<StatusText>('Loading');

  useEffect(() => {
    // deliberately throttle loading to see spinner
    // TODO: remove after demonstration
    setTimeout(() => {
      if (!wallSelector.id) return;
      setSocket({
        uri: `${useServerURI()}/walls`,
        opts: {
          query: {
            wall: wallSelector.id,
          },
        },
      });
    }, 3000);
  }, [setSocket, wallSelector.id]);

  useEffect(() => {
    switch (wallSelector.status) {
      case 'loading':
        setStatusText('Loading');
        break;
      case 'success':
        setStatusText('Editing');
        break;
      case 'error':
        setStatusText('Error Loading');
        break;
      default:
        setStatusText('Loading');
    }
  }, [wallSelector.status]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connected', (data: WallType) => {
      dispatch(setWall(data));
      dispatch(setWallStatus('success'));
    });

    socket.on('error', (err) => {
      // TODO: handle socket errors
      console.log('error', err);
      dispatch(setWallStatus('error'));
    });
  }, [socket]);

  const handlePixelEdit = (pixel: LocalPixel) => {
    if (!socket) return;
    dispatch(setPixel(pixel));
    dispatch(clearEditingPixel());
    socket.emit('pixel-edit', pixel);
  };

  return (
    <div
      className={styles.wallEditorContainer}
      style={{
        borderColor: color,
      }}
    >
      <h1>
        {statusText} WALL {wallSelector.id || 'unknown'}
      </h1>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Wall />
        {wallSelector.editingPixel ? (
          <PixelEditor onApply={handlePixelEdit} />
        ) : null}
      </div>
    </div>
  );
}

export default WallEditor;
