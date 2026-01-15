import React from 'react';
import { Home, Music, Radio, Grid, Search, PlaySquare, Heart, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlayerStore } from '../store';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={clsx(
      "flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium",
      active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={20} />
    <span>{label}</span>
  </div>
);

const SidebarGroup = ({ title, children }) => (
  <div className="mb-6">
    {title && <h3 className="px-4 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">{title}</h3>}
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const Sidebar = () => {
  const { currentView, setCurrentView } = usePlayerStore();

  return (
    <div className="w-64 h-full bg-[#1c1c1e]/90 backdrop-blur-xl border-r border-white/10 flex flex-col p-4 pt-10">
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Music className="text-pink-500" size={32} />
          <span className="text-xl font-bold">Music</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-white/10 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/20 transition-colors"
            onFocus={() => setCurrentView('home')}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <SidebarGroup>
          <SidebarItem 
            icon={Home} 
            label="Search" 
            active={currentView === 'home'} 
            onClick={() => setCurrentView('home')} 
          />
          <SidebarItem icon={Grid} label="Browse" />
          <SidebarItem icon={Radio} label="Radio" />
        </SidebarGroup>

        <SidebarGroup title="Library">
          <SidebarItem icon={Clock} label="Recently Added" />
          <SidebarItem 
            icon={Music} 
            label="Songs" 
            active={currentView === 'library'}
            onClick={() => setCurrentView('library')}
          />
          <SidebarItem 
            icon={PlaySquare} 
            label="Albums" 
            active={currentView === 'albums'}
            onClick={() => setCurrentView('albums')}
          />
          <SidebarItem icon={Heart} label="Artists" />
        </SidebarGroup>

        <SidebarGroup title="Playlists">
          <SidebarItem icon={PlaySquare} label="My Top Rated" />
          <SidebarItem icon={PlaySquare} label="Workout Mix" />
        </SidebarGroup>
      </div>
    </div>
  );
};

export default Sidebar;
