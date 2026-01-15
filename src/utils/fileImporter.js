import * as mm from 'music-metadata-browser';

export const importMusicFromFolder = async () => {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const songs = [];
    
    for await (const entry of getFilesRecursively(dirHandle)) {
      if (entry.kind === 'file' && isAudioFile(entry.name)) {
        const file = await entry.getFile();
        try {
          // Parse metadata
          const metadata = await mm.parseBlob(file);
          const { common, format } = metadata;
          
          let coverUrl = null;
          if (common.picture && common.picture.length > 0) {
            const picture = common.picture[0];
            const blob = new Blob([picture.data], { type: picture.format });
            coverUrl = URL.createObjectURL(blob);
            // Note: In a real app, storing Blob URLs in DB is tricky because they expire.
            // Better to store the Blob itself or re-generate on load. 
            // For now, we will store the Blob in the DB if we want persistence, 
            // or just rely on re-parsing (slow).
            // Optimization: Store the cover Blob in a separate 'covers' store in DB?
            // For simplicity in this MVP, we won't store the cover BLOB in DB to save space/complexity,
            // We might just re-read the file when playing. 
            // BUT for the list view, we need thumbnails. 
            // Let's store a small blob or just null for now and load on demand?
            // Let's just store the necessary info.
          }

          songs.push({
            title: common.title || file.name,
            artist: common.artist || 'Unknown Artist',
            album: common.album || 'Unknown Album',
            duration: format.duration || 0,
            fileHandle: entry, // Store the handle to request permission later if needed
            // coverBlob: common.picture ? common.picture[0].data : null // Too heavy for bulk list?
            // Let's just skip cover persistence for the list view for now to speed up.
            // We can load cover when playing.
          });
        } catch (err) {
          console.warn('Failed to parse metadata for', entry.name, err);
          // Add basic info if parse fails
          songs.push({
            title: entry.name,
            artist: 'Unknown',
            album: 'Unknown',
            duration: 0,
            fileHandle: entry
          });
        }
      }
    }
    return songs;
  } catch (err) {
    if (err.name === 'AbortError') {
      return []; // User cancelled
    }
    console.error('Error importing music:', err);
    throw err;
  }
};

async function* getFilesRecursively(entry) {
  if (entry.kind === 'file') {
    yield entry;
  } else if (entry.kind === 'directory') {
    for await (const handle of entry.values()) {
      yield* getFilesRecursively(handle);
    }
  }
}

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'];

function isAudioFile(filename) {
  const lowerName = filename.toLowerCase();
  return AUDIO_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}
