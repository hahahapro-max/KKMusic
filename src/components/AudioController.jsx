import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store';

const AudioController = () => {
  const audioRef = useRef(new Audio());
  const { 
    currentSong, isPlaying, volume, setIsPlaying, nextSong, 
    setCurrentTime, setDuration, currentTime
  } = usePlayerStore();

  // Handle Play/Pause and Source Change
  useEffect(() => {
    const audio = audioRef.current;
    
    if (!currentSong) {
      audio.pause();
      audio.src = '';
      return;
    }

    // Get the file blob URL
    // NOTE: In a real app we might need to revoke object URLs to avoid memory leaks
    // For now, we just create a new one.
    const loadAndPlay = async () => {
      let src = '';
      if (currentSong.url) {
         // Direct URL (Search Result)
         src = currentSong.url;
      } else if (currentSong.fileHandle) {
        try {
          const file = await currentSong.fileHandle.getFile();
          src = URL.createObjectURL(file);
        } catch (e) {
          console.error("Failed to load file", e);
          // If permission lost, we might need to ask user again.
          // For MVP we assume permission persists for session or re-prompt needed (not implemented yet)
        }
      } else {
        // Fallback or demo data
        // src = currentSong.url; 
      }

      if (src) {
        // Only update src if it changed to avoid reloading same song
        // Actually, we should check if it's the same song ID.
        // But the store updates currentSong only when it changes usually.
        // To be safe, we can store currentSrc in a ref.
        if (audio.src !== src) {
            audio.src = src;
            audio.load();
        }
        
        if (isPlaying) {
            audio.play().catch(e => console.warn("Autoplay prevented", e));
        }
      }
    };

    loadAndPlay();

    return () => {
        // cleanup if needed
    };
  }, [currentSong]);

  // Handle Play/Pause Toggle
  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
        if (audio.paused && audio.src) audio.play().catch(() => {});
    } else {
        if (!audio.paused) audio.pause();
    }
  }, [isPlaying]);

  // Handle Volume
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Handle Seeking (One-way sync: Store -> Audio)
  // We need to be careful not to create a loop.
  // We can use a ref to track if the update came from the audio event or the user.
  // Actually, standard way is: User drags -> updates Store -> useEffect updates Audio.
  // Audio plays -> timeupdate event -> updates Store.
  // To avoid loop/stutter, we usually don't update Audio.currentTime in useEffect dependent on Store.currentTime
  // UNLESS it's a "seek" action. 
  // Simplified: Store has `seekTime` or we just set it directly.
  // For now, let's assume `currentTime` in store is only updated by audio event, 
  // OR by user seek. If user seek, we update audio.
  // But React state doesn't differentiate.
  // Let's rely on the input onChange in UI to update Audio directly? 
  // No, clean architecture prefers store.
  // Let's try: if the difference is large (>1s), sync it.
  useEffect(() => {
    const audio = audioRef.current;
    if (Math.abs(audio.currentTime - currentTime) > 1) {
        audio.currentTime = currentTime;
    }
  }, [currentTime]);

  // Setup Event Listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
        // Only update store if the difference is significant to avoid re-renders?
        // Actually Zustand is fast.
        // But we need to avoid the loop mentioned above.
        // We can use a flag `isSeeking` in store?
        // Or just `usePlayerStore.setState({ currentTime: audio.currentTime })` directly without triggering listeners if possible?
        // Let's just update.
        if (!audio.paused) {
             setCurrentTime(audio.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        setDuration(audio.duration);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        nextSong();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [nextSong, setIsPlaying, setCurrentTime, setDuration]);

  return null; // Logic only
};

export default AudioController;
