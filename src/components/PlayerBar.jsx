import React, { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, ListMusic } from 'lucide-react';
import { usePlayerStore } from '../store';
import { matchAndGetMetadata } from '../services/netease';

const PlayerBar = () => {
  const { 
      currentSong, isPlaying, setIsPlaying, nextSong, prevSong, 
      toggleFullScreen, volume, setVolume, currentTime, duration, 
      setDuration, setCurrentTime, updateCurrentSongMetadata 
  } = usePlayerStore();

  useEffect(() => {
    const autoMatch = async () => {
       if (currentSong?.id) {
         const hasLyrics = !!currentSong.lyrics;
         const hasRemoteCover = !!currentSong.remoteCoverUrl;
         
         if (!hasLyrics || !hasRemoteCover) {
             try {
                const updates = await matchAndGetMetadata(currentSong.title, currentSong.artist);
                if (updates) {
                    updateCurrentSongMetadata(updates);
                }
             } catch (e) {
                // silent error
             }
         }
       }
    };
    autoMatch();
  }, [currentSong?.id]);

  if (!currentSong) return null;

  // Display cover logic
  const displayCover = currentSong.remoteCoverUrl || (currentSong.coverBlob 
    ? URL.createObjectURL(new Blob([currentSong.coverBlob]))
    : null);

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    // Note: The actual audio element seek logic will be in the AudioController component
  };

  return (
    <div className="h-20 bg-[#1c1c1e]/95 backdrop-blur-xl border-t border-white/10 flex items-center px-4 justify-between z-50">
      {/* Song Info */}
      <div className="flex items-center gap-4 w-[30%] min-w-0">
        <div className="w-12 h-12 rounded-md bg-white/10 overflow-hidden flex-shrink-0 relative group cursor-pointer" onClick={toggleFullScreen}>
          {displayCover ? (
             <img src={displayCover} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center bg-gray-800">
               <span className="text-xs text-white/40">Music</span>
             </div>
          )}
          <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
            <Maximize2 size={16} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate text-sm hover:underline cursor-pointer" onClick={toggleFullScreen}>{currentSong.title}</div>
          <div className="text-xs text-white/60 truncate hover:underline cursor-pointer">{currentSong.artist}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-1 w-[40%]">
        <div className="flex items-center gap-6">
          <button onClick={prevSong} className="text-white/60 hover:text-white transition">
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={nextSong} className="text-white/60 hover:text-white transition">
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>
        <div className="w-full max-w-md flex items-center gap-2 text-[10px] text-white/40 font-medium tabular-nums">
           <span>{formatTime(currentTime)}</span>
           <input 
             type="range" 
             min={0} 
             max={duration || 100} 
             value={currentTime} 
             onChange={handleSeek}
             className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:bg-white"
           />
           <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Misc */}
      <div className="flex items-center justify-end gap-4 w-[30%]">
        <button className="text-white/60 hover:text-white">
          <ListMusic size={18} />
        </button>
        <div className="flex items-center gap-2 w-24">
          <Volume2 size={16} className="text-white/60" />
          <input 
            type="range" 
            min={0} 
            max={1} 
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>
    </div>
  );
};

const formatTime = (time) => {
  if (!time) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default PlayerBar;
