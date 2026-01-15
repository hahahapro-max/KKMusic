import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, MoreHorizontal, MessageSquareQuote, ChevronDown, Wand2, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlayerStore } from '../store'
import { matchAndGetMetadata, parseLyrics } from '../services/netease'
import { useState, useEffect, useRef } from 'react'

function FullScreenPlayer() {
  const { 
    currentSong, isPlaying, setIsPlaying, nextSong, prevSong, 
    toggleFullScreen, volume, setVolume, currentTime, duration, setCurrentTime,
    updateCurrentSongMetadata, toggleLike
  } = usePlayerStore()

  const [isMatching, setIsMatching] = useState(false);
  const [lyrics, setLyrics] = useState([]);
  const [showLyrics, setShowLyrics] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const lyricsContainerRef = useRef(null);

  // Load lyrics if available
  useEffect(() => {
      if (currentSong?.lyrics) {
          setLyrics(parseLyrics(currentSong.lyrics));
      } else {
          setLyrics([]);
      }
  }, [currentSong]);

  // Sync lyrics
  useEffect(() => {
      if (!lyrics.length) return;
      const index = lyrics.findIndex((line, i) => {
          const nextLine = lyrics[i + 1];
          return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
      });
      setActiveLyricIndex(index);
  }, [currentTime, lyrics]);

  // Auto-scroll lyrics
  useEffect(() => {
    if (showLyrics && activeLyricIndex !== -1 && lyricsContainerRef.current) {
      const activeElement = lyricsContainerRef.current.children[activeLyricIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeLyricIndex, showLyrics]);

  const handleMatchInfo = async (silent = false) => {
    if (!currentSong) return;
    setIsMatching(true);
    try {
        const updates = await matchAndGetMetadata(currentSong.title, currentSong.artist);
        
        if (updates) {
            updateCurrentSongMetadata(updates);
            
            // If we manually triggered this and found lyrics, switch to lyrics view
            if (!silent && updates.lyrics) {
               setShowLyrics(true);
            }
        } else {
            if (!silent) alert("No match found");
        }
    } catch (e) {
        console.error(e);
        if (!silent) alert("Failed to match info");
    } finally {
        setIsMatching(false);
    }
  };

  if (!currentSong) return null;

  // Format time helper
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Cover logic
  const displayCover = currentSong.remoteCoverUrl || (currentSong.coverBlob 
    ? URL.createObjectURL(new Blob([currentSong.coverBlob]))
    : "https://upload.wikimedia.org/wikipedia/commons/c/ca/CD-ROM.png");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-white font-sans">
      {/* 动态模糊背景 */}
      <div 
        className="absolute inset-0 z-0 transition-colors duration-1000 ease-in-out opacity-60 bg-gray-900"
      />
      <div className="absolute inset-0 z-0 backdrop-blur-[100px] bg-black/30" />

      {/* Background Image Blurring */}
      {displayCover && (
         <div 
            className="absolute inset-0 z-[-1] opacity-50 blur-3xl scale-125 transition-all duration-1000"
            style={{ 
               backgroundImage: `url(${displayCover})`,
               backgroundPosition: 'center',
               backgroundSize: 'cover'
            }}
         />
      )}


      <div className="relative z-10 flex flex-col h-full max-w-5xl mx-auto p-8 pt-12">
        {/* 顶部导航栏 */}
        <div className="flex justify-between items-center mb-8 relative">
           <button 
             onClick={toggleFullScreen}
             className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition"
           >
             <ChevronDown size={20} /> 
           </button>
           
           <div className="flex gap-2 bg-black/20 rounded-lg p-1">
             <button 
                onClick={() => setShowLyrics(false)}
                className={`px-4 py-1 rounded-md text-xs font-medium transition ${!showLyrics ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
             >
                Cover
             </button>
             <button 
                onClick={() => setShowLyrics(true)}
                className={`px-4 py-1 rounded-md text-xs font-medium transition ${showLyrics ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
             >
                Lyrics
             </button>
           </div>

           <button 
             onClick={() => handleMatchInfo(false)}
             disabled={isMatching}
             className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition disabled:opacity-50"
             title="Auto Match Info"
           >
             <Wand2 size={16} className={isMatching ? "animate-spin" : ""} />
           </button>
        </div>

        {/* 主要内容区域 */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 pb-20">
          
          {/* 视图切换: 封面 vs 歌词 */}
          {showLyrics ? (
              <div 
                ref={lyricsContainerRef}
                className="w-full h-[50vh] md:h-[60vh] overflow-y-auto custom-scrollbar text-center space-y-6 mask-linear-gradient"
              >
                  {lyrics.length > 0 ? (
                      lyrics.map((line, i) => (
                          <motion.p
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ 
                                opacity: activeLyricIndex === i ? 1 : 0.5, 
                                scale: activeLyricIndex === i ? 1.05 : 1,
                                filter: activeLyricIndex === i ? 'blur(0px)' : 'blur(0.5px)',
                                color: activeLyricIndex === i ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'
                            }}
                            className={`text-lg md:text-2xl font-bold transition-all duration-500 cursor-pointer hover:opacity-80`}
                            onClick={() => {
                                // Optional: Seek to lyric time
                                const audio = document.querySelector('audio');
                                if (audio) audio.currentTime = line.time;
                                setCurrentTime(line.time);
                            }}
                          >
                              {line.text}
                          </motion.p>
                      ))
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white/40">
                          <p>No lyrics available</p>
                          <button onClick={handleMatchInfo} className="mt-4 text-pink-500 hover:underline">
                              Try Auto-Match
                          </button>
                      </div>
                  )}
              </div>
          ) : (
              <motion.div 
                key={currentSong.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative group aspect-square w-full max-w-[350px] md:max-w-[400px] shadow-2xl rounded-xl overflow-hidden bg-white/5"
              >
                 <img 
                   src={displayCover} 
                   alt={currentSong.album}
                   className="w-full h-full object-cover"
                 />
                 <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] rounded-xl pointer-events-none"></div>
              </motion.div>
          )}

          {/* 播放控制与信息 */}
          <div className="flex flex-col w-full max-w-md gap-6">
            
            {/* 歌曲信息 */}
            <div className="space-y-1">
              <motion.h1 
                key={currentSong.title}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl md:text-3xl font-bold truncate"
              >
                {currentSong.title}
              </motion.h1>
              <motion.p 
                key={currentSong.artist}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-xl text-white/60 truncate"
              >
                {currentSong.artist} — {currentSong.album}
              </motion.p>
            </div>

            {/* 进度条 */}
            <div className="group space-y-2">
              <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-white/80 rounded-full group-hover:bg-white transition-colors"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
                <input 
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-xs text-white/40 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime((duration || 0) - currentTime)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-10">
              <button 
                onClick={prevSong}
                className="text-white/70 hover:text-white transition transform active:scale-95"
              >
                <SkipBack size={32} fill="currentColor" />
              </button>
              
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:scale-105 transition transform active:scale-95"
              >
                 {isPlaying ? (
                   <Pause size={48} fill="currentColor" />
                 ) : (
                   <Play size={48} fill="currentColor" />
                 )}
              </button>

              <button 
                onClick={nextSong}
                className="text-white/70 hover:text-white transition transform active:scale-95"
              >
                <SkipForward size={32} fill="currentColor" />
              </button>
            </div>

            {/* 音量与杂项 */}
            <div className="flex items-center justify-between mt-4">
               <div className="flex items-center gap-6">
                   <button className="text-white/50 hover:text-white transition">
                     <MessageSquareQuote size={20} />
                   </button>
                   <button 
                     onClick={() => toggleLike(currentSong)}
                     className={`transition transform active:scale-95 ${currentSong.liked ? 'text-pink-500' : 'text-white/50 hover:text-white'}`}
                   >
                     <Heart size={20} fill={currentSong.liked ? "currentColor" : "none"} />
                   </button>
               </div>
               
               <div className="flex items-center gap-3 w-32 group">
                 <Volume2 size={18} className="text-white/50" />
                 <div className="relative flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-white/80 rounded-full"
                      style={{ width: `${volume * 100}%` }}
                    />
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenPlayer
