import Dexie from 'dexie';

export const db = new Dexie('MusicDatabase');

db.version(1).stores({
  songs: '++id, title, artist, album, duration, liked, fileHandle, [artist+album]', // Indexed fields
  playlists: '++id, name',
  playlistSongs: '++id, playlistId, songId'
});

export const addSongs = async (songsData) => {
  return await db.songs.bulkAdd(songsData);
};

export const getAllSongs = async () => {
  return await db.songs.toArray();
};
