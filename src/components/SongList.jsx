import React, { useEffect } from 'react';
import { Play, Clock, FolderPlus, Heart } from 'lucide-react';
import { useLibraryStore, usePlayerStore } from '../store';
import { importMusicFromFolder } from '../utils/fileImporter';

const SongList = () => {
  const { songs, loadSongs, addSongsToLibrary, isLoading } = useLibraryStore();
  const { playSong, currentSong, isPlaying, toggleLike } = usePlayerStore();

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const handleImport = async () => {
    try {
      const newSongs = await importMusicFromFolder();
      if (newSongs.length > 0) {
        await addSongsToLibrary(newSongs);
      }
    } catch (err) {
      console.error("Import failed", err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-black">
      <div className="p-8 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-1">Songs</h1>
          <p className="text-white/60 text-sm">{songs.length} songs</p>
        </div>
        <button 
          onClick={handleImport}
          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <FolderPlus size={18} />
          Add Folder
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
        <div className="w-full text-left border-collapse">
          <div className="sticky top-0 bg-black z-10 grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 py-3 border-b border-white/10 text-xs font-medium text-white/40 uppercase tracking-wider">
            <div className="w-8 text-center">#</div>
            <div>Title</div>
            <div>Artist</div>
            <div>Album</div>
            <div className="w-8"></div>
            <div className="w-16 text-right"><Clock size={14} className="ml-auto" /></div>
          </div>
          
          <div className="mt-2 space-y-1">
            {isLoading ? (
              <div className="text-center py-10 text-white/40">Loading library...</div>
            ) : songs.length === 0 ? (
              <div className="text-center py-20 text-white/40">
                <p className="text-lg mb-2">No music found</p>
                <p className="text-sm">Click "Add Folder" to import your local music.</p>
              </div>
            ) : (
              songs.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div 
                    key={song.id}
                    onDoubleClick={() => playSong(song, songs)}
                    className={`grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-4 py-2.5 px-2 rounded-lg items-center text-sm group hover:bg-white/10 transition-colors cursor-default ${isCurrent ? 'bg-white/10 text-pink-500' : 'text-white/80'}`}
                  >
                    <div className="w-8 text-center relative flex justify-center">
                      <span className={`group-hover:hidden ${isCurrent ? 'hidden' : 'block'}`}>{index + 1}</span>
                      <button 
                        onClick={() => playSong(song, songs)}
                        className={`hidden group-hover:block ${isCurrent && isPlaying ? 'hidden' : ''}`}
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                      {isCurrent && isPlaying && (
                         <div className="w-3 h-3 flex gap-0.5 items-end justify-center">
                           <div className="w-0.5 bg-pink-500 animate-[bounce_1s_infinite]" />
                           <div className="w-0.5 bg-pink-500 animate-[bounce_1.2s_infinite]" />
                           <div className="w-0.5 bg-pink-500 animate-[bounce_0.8s_infinite]" />
                         </div>
                      )}
                    </div>
                    <div className="font-medium truncate text-white">{song.title}</div>
                    <div className="truncate text-white/60">{song.artist}</div>
                    <div className="truncate text-white/60">{song.album}</div>
                    <div className="w-8 flex justify-center">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           toggleLike(song);
                         }}
                         className={`transition-all ${song.liked ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-100 text-white/40 hover:text-white'}`}
                       >
                         <Heart size={16} fill={song.liked ? "currentColor" : "none"} />
                       </button>
                    </div>
                    <div className="w-16 text-right text-white/40 font-variant-numeric tabular-nums">
                      {formatDuration(song.duration)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongList;
