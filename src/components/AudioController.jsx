import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store';
import Hls from 'hls.js';

const AudioController = () => {
  const audioRef = useRef(new Audio());
  const hlsRef = useRef(null);
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
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const loadAndPlay = async () => {
      let src = '';
      if (currentSong.url) {
         src = currentSong.url;
      } else if (currentSong.fileHandle) {
        try {
          const file = await currentSong.fileHandle.getFile();
          src = URL.createObjectURL(file);
        } catch (e) {
          console.error("Failed to load file", e);
        }
      }

      if (src) {
        // Destroy previous HLS instance if exists
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        // Check for HLS support
        // Only treat as HLS if extension matches. Do NOT force all radio to HLS.
        const isHlsSource = src.includes('.m3u8') || src.includes('.m3u');
        
        if (Hls.isSupported() && isHlsSource) {
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(audio);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
             if (isPlaying) audio.play().catch(e => console.warn("Autoplay prevented", e));
          });
          hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
              console.warn("HLS fatal error", data.type, data.details);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log("fatal network error encountered, trying fallback to native audio");
                  hls.destroy();
                  hlsRef.current = null;
                  // Fallback to native audio (might work for some streams or if HLS.js is too strict)
                  audio.src = src;
                  if (isPlaying) audio.play().catch(e => console.warn("Fallback play failed", e));
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log("fatal media error encountered, try to recover");
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  break;
              }
            }
          });
        } 
        // Native HLS support (Safari)
        else if (audio.canPlayType('application/vnd.apple.mpegurl') && isHlsSource) {
           audio.src = src;
           if (isPlaying) {
             audio.play().catch(e => console.warn("Autoplay prevented", e));
           }
        }
        // Standard Audio
        else {
           if (audio.src !== src) {
               audio.src = src;
               audio.load();
           }
           if (isPlaying) {
               audio.play().catch(e => console.warn("Autoplay prevented", e));
           }
        }
      }
    };

    loadAndPlay();

    return () => {
        // cleanup if needed
    };
  }, [currentSong]); // Note: removed isPlaying from dep array to avoid re-loading on pause/play toggle

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
