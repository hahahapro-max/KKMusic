import React, { useState } from 'react';
import { Search as SearchIcon, Play, Download, Loader2, Heart } from 'lucide-react';
import { searchMusic, getPlayUrl } from '../services/tunefree';
import { usePlayerStore } from '../store';
import { useLibraryStore } from '../store';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  const { playSong } = usePlayerStore();
  const { songs: librarySongs } = useLibraryStore();
  const toggleLike = usePlayerStore(state => state.toggleLike);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      // Use TuneFree API
      const songs = await searchMusic(query);
      setResults(songs);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setSearching(false);
    }
  };

  const handlePlay = async (song) => {
    setLoading(true);
    try {
      // TuneFree search results usually include playUrl
      let url = song.playUrl;

      // If no URL in search result, try to fetch it
      if (!url) {
        url = await getPlayUrl(song.id, song.source);
      }
      
      if (url) {
        const track = {
          id: song.id,
          title: song.name,
          artist: song.artist,
          album: song.album || 'Unknown Album',
          duration: song.duration || 0,
          coverUrl: song.picUrl,
          remoteCoverUrl: song.picUrl,
          url: url,
          liked: librarySongs.some(s => s.id === song.id && s.liked)
        };
        
        // Create a queue from the current search results
        const queue = results.map(s => ({
          id: s.id,
          title: s.name,
          artist: s.artist,
          album: s.album || 'Unknown Album',
          duration: s.duration || 0,
          coverUrl: s.picUrl,
          remoteCoverUrl: s.picUrl,
          url: s.playUrl,
          liked: librarySongs.some(ls => ls.id === s.id && ls.liked)
        }));

        // Ensure the clicked song in the queue has the correct (potentially freshly fetched) URL
        const trackIndex = queue.findIndex(q => q.id === track.id);
        if (trackIndex !== -1) {
            queue[trackIndex] = track;
        }

        playSong(track, queue);
      } else {
        alert("Failed to get playback URL");
      }
    } catch (e) {
      console.error(e);
      alert("Error playing song");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (song) => {
    if (song.playUrl) {
      window.open(song.playUrl, '_blank');
    } else {
      alert("Failed to get download URL");
    }
  };

  const isLiked = (songId) => {
    return librarySongs.some(s => s.id === songId && s.liked);
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-black p-8">
      <h1 className="text-3xl font-bold mb-8">Search</h1>
      
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for songs, artists..." 
            className="w-full bg-white/10 rounded-xl pl-12 pr-4 py-3 text-lg text-white placeholder-white/40 focus:outline-none focus:bg-white/20 transition-colors"
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={searching}
          className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {searching ? <Loader2 className="animate-spin" /> : "Search"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((song) => {
              const liked = isLiked(song.id);
              return (
                <div key={song.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                     {song.picUrl ? (
                       <img src={song.picUrl} alt={song.album} className="w-12 h-12 rounded-md object-cover" />
                     ) : (
                       <div className="w-12 h-12 rounded-md bg-white/10 flex items-center justify-center text-xs text-white/40">No Cover</div>
                     )}
                     <div className="min-w-0">
                       <div className="font-medium text-white truncate">{song.name}</div>
                       <div className="text-sm text-white/60 truncate">
                          {song.artist} — {song.album}
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Need to convert search result to song object for toggleLike
                        const track = {
                          id: song.id,
                          title: song.name,
                          artist: song.artist,
                          album: song.album || 'Unknown Album',
                          duration: song.duration || 0,
                          coverUrl: song.picUrl,
                          remoteCoverUrl: song.picUrl,
                          url: song.playUrl,
                          liked: liked
                        };
                        toggleLike(track);
                      }}
                      className={`transition-all ${liked ? 'opacity-100 text-pink-500' : 'text-white/40 hover:text-white'}`}
                    >
                      <Heart size={16} fill={liked ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={() => handlePlay(song)}
                      className="p-2 bg-white text-black rounded-full hover:scale-105 transition"
                      title="Play"
                    >
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </button>
                    <button 
                      onClick={() => handleDownload(song)}
                      className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {results.length === 0 && !searching && query && (
          <div className="text-center text-white/40 mt-20">
             Try searching for a song name like "晴天"
          </div>
        )}
      </div>
      
      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1c1c1e] p-6 rounded-xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-pink-500" size={32} />
            <p>Fetching song URL...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
