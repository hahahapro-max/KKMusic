import { create } from 'zustand';
import { db } from './db';

export const usePlayerStore = create((set, get) => ({
  // Playback State
  isPlaying: false,
  currentSong: null,
  queue: [], // List of song objects
  currentIndex: -1,
  volume: 1,
  duration: 0,
  currentTime: 0,
  isFullScreen: false, // Player full screen mode

  // View State
  currentView: 'home', // 'home', 'library', 'radio'
  setCurrentView: (view) => set({ currentView: view }),

  // Actions
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  playSong: (song, queue = []) => {
    // If a queue is provided, replace the current queue
    // If not, just play this song (maybe add to queue or just set as current)
    const newQueue = queue.length > 0 ? queue : [song];
    const index = newQueue.findIndex(s => s.id === song.id);
    
    set({ 
      currentSong: song, 
      queue: newQueue, 
      currentIndex: index !== -1 ? index : 0,
      isPlaying: true 
    });
  },

  nextSong: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    set({ currentSong: queue[nextIndex], currentIndex: nextIndex });
  },

  prevSong: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    set({ currentSong: queue[prevIndex], currentIndex: prevIndex });
  },

  updateCurrentSongMetadata: (metadata) => set(state => {
    if (!state.currentSong) return {};
    const updatedSong = { ...state.currentSong, ...metadata };
    
    // Also update in queue
    const newQueue = state.queue.map(s => s.id === updatedSong.id ? updatedSong : s);
    
    // Also update in DB (async, fire and forget)
    db.songs.update(updatedSong.id, metadata).catch(err => console.error("Failed to update DB", err));

    return { currentSong: updatedSong, queue: newQueue };
  }),

  toggleLike: async (song) => {
    if (!song) return;
    const newLikedStatus = !song.liked;
    const updatedSong = { ...song, liked: newLikedStatus };

    // Update DB
    await db.songs.update(song.id, { liked: newLikedStatus });

    // Update Player State (if current song or in queue)
    set(state => {
      const isCurrent = state.currentSong?.id === song.id;
      const newQueue = state.queue.map(s => s.id === song.id ? updatedSong : s);
      return {
        currentSong: isCurrent ? updatedSong : state.currentSong,
        queue: newQueue
      };
    });

    // Update Library State
    useLibraryStore.setState(state => ({
      songs: state.songs.map(s => s.id === song.id ? updatedSong : s)
    }));
  },
  
  toggleFullScreen: () => set(state => ({ isFullScreen: !state.isFullScreen })),
  
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
}));

export const useLibraryStore = create((set) => ({
  songs: [],
  isLoading: false,

  loadSongs: async () => {
    set({ isLoading: true });
    const songs = await db.songs.toArray();
    set({ songs, isLoading: false });
  },

  addSongsToLibrary: async (newSongs) => {
    // Add to DB first
    await db.songs.bulkAdd(newSongs);
    // Reload from DB to get IDs
    const songs = await db.songs.toArray();
    set({ songs });
  }
}));
