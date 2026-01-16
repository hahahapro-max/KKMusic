import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SongList from './components/SongList';
import SearchPage from './components/SearchPage';
import AlbumsView from './components/AlbumsView';
import RadioView from './components/RadioView';
import PlayerBar from './components/PlayerBar';
import FullScreenPlayer from './components/FullScreenPlayer';
import AudioController from './components/AudioController';
import { usePlayerStore } from './store';

function App() {
  const { isFullScreen, currentView } = usePlayerStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <SearchPage />;
      case 'radio':
        return <RadioView />;
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
      
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden absolute top-4 left-4 z-40 p-2 text-white/60 hover:text-white bg-black/20 backdrop-blur-md rounded-lg"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0 w-full">
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
