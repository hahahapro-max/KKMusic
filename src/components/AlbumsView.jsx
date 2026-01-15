import React, { useState, useMemo } from 'react';
import { useLibraryStore, usePlayerStore } from '../store';
import { Play, Heart, ChevronLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const AlbumsView = () => {
  const { songs } = useLibraryStore();
  const { playSong, currentSong, isPlaying, toggleLike } = usePlayerStore();
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const albums = useMemo(() => {
    const albumMap = {};
    const likedSongs = [];

    songs.forEach(song => {
      if (song.liked) {
        likedSongs.push(song);
      }
      
      const albumName = song.album || 'Unknown Album';
      if (!albumMap[albumName]) {
        albumMap[albumName] = {
          name: albumName,
          artist: song.artist || 'Unknown Artist',
          songs: [],
          cover: song.remoteCoverUrl || (song.coverBlob ? URL.createObjectURL(new Blob([song.coverBlob])) : null)
        };
      }
      albumMap[albumName].songs.push(song);
    });

    const list = Object.values(albumMap).sort((a, b) => a.name.localeCompare(b.name));
    
    if (likedSongs.length > 0) {
      list.unshift({
        name: 'Favorites',
        artist: 'Various Artists',
        songs: likedSongs,
        isFavorites: true,
        cover: null // We'll handle this in UI
      });
    }

    return list;
  }, [songs]);

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (selectedAlbum) {
    return (
      <div className="flex-1 h-full overflow-hidden flex flex-col bg-black">
        <div className="p-8 pb-4">
          <button 
            onClick={() => setSelectedAlbum(null)}
            className="flex items-center gap-1 text-pink-500 hover:underline mb-4 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            Back to Albums
          </button>
          
          <div className="flex gap-6 items-end">
            <div className="w-40 h-40 shadow-2xl rounded-lg overflow-hidden bg-white/10 flex items-center justify-center relative group">
               {selectedAlbum.isFavorites ? (
                 <div className="w-full h-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                   <Heart size={64} fill="white" className="text-white" />
                 </div>
               ) : selectedAlbum.cover ? (
                 <img src={selectedAlbum.cover} alt={selectedAlbum.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                   <span className="text-4xl text-white/20 font-bold">{selectedAlbum.name[0]}</span>
                 </div>
               )}
            </div>
            <div>
               <h1 className="text-4xl font-bold mb-2">{selectedAlbum.name}</h1>
               <p className="text-xl text-pink-500 font-medium">{selectedAlbum.artist}</p>
               <p className="text-white/60 text-sm mt-1">{selectedAlbum.songs.length} songs</p>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
             <button 
                onClick={() => playSong(selectedAlbum.songs[0], selectedAlbum.songs)}
                className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg font-bold transition-colors"
             >
                <Play fill="currentColor" size={20} />
                Play
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-0">
          <div className="w-full text-left border-collapse">
            <div className="sticky top-0 bg-black z-10 grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 py-3 border-b border-white/10 text-xs font-medium text-white/40 uppercase tracking-wider">
              <div className="w-8 text-center">#</div>
              <div>Title</div>
              <div>Artist</div>
              <div className="w-8"></div>
              <div className="w-16 text-right"><Clock size={14} className="ml-auto" /></div>
            </div>
            
            <div className="mt-2 space-y-1">
              {selectedAlbum.songs.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div 
                    key={song.id}
                    onDoubleClick={() => playSong(song, selectedAlbum.songs)}
                    className={`grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 py-2.5 px-2 rounded-lg items-center text-sm group hover:bg-white/10 transition-colors cursor-default ${isCurrent ? 'bg-white/10 text-pink-500' : 'text-white/80'}`}
                  >
                    <div className="w-8 text-center relative flex justify-center">
                      <span className={`group-hover:hidden ${isCurrent ? 'hidden' : 'block'}`}>{index + 1}</span>
                      <button 
                        onClick={() => playSong(song, selectedAlbum.songs)}
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
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-black">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Albums</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.map((album) => (
            <motion.div 
              key={album.name}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedAlbum(album)}
              className="group cursor-pointer"
            >
              <div className="aspect-square w-full rounded-lg overflow-hidden bg-white/5 mb-3 shadow-lg relative">
                 {album.isFavorites ? (
                   <div className="w-full h-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                      <Heart size={48} fill="white" className="text-white drop-shadow-md" />
                   </div>
                 ) : album.cover ? (
                   <img src={album.cover} alt={album.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/20 font-bold text-4xl">
                     {album.name[0]}
                   </div>
                 )}
                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition duration-300">
                      <Play fill="white" className="ml-1 text-white" size={24} />
                    </div>
                 </div>
              </div>
              <h3 className="font-bold text-white truncate">{album.name}</h3>
              <p className="text-sm text-white/60 truncate">{album.artist}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlbumsView;