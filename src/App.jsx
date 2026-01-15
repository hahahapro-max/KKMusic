import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import SongList from './components/SongList';
import SearchPage from './components/SearchPage';
import AlbumsView from './components/AlbumsView';
import PlayerBar from './components/PlayerBar';
import FullScreenPlayer from './components/FullScreenPlayer';
import AudioController from './components/AudioController';
import { usePlayerStore } from './store';

function App() {
  const { isFullScreen, currentView } = usePlayerStore();

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <SearchPage />;
      case 'albums':
        return <AlbumsView />;
      case 'library':
      default:
        return <SongList />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans selection:bg-pink-500 selection:text-white">
      <AudioController />
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {renderContent()}
        
        {/* Player Bar (Always visible unless FullScreen covers it, but FullScreen is fixed z-50) */}
        <PlayerBar />
      </div>

      {/* Full Screen Player Overlay */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100]"
          >
            <FullScreenPlayer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
