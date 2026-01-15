import axios from 'axios';

// We use the existing /netease proxy
const PROXY_PREFIX = '/netease';

export const searchMusic = async (query, page = 1, limit = 10) => {
  try {
    // We fetch more than limit to account for filtered (unplayable) songs
    // A safe multiplier is 3x (e.g. fetch 30 to get 10 valid ones)
    const fetchLimit = limit * 3;
    const offset = (page - 1) * fetchLimit;

    // Use Netease Search API via Proxy
    const response = await axios.get(`${PROXY_PREFIX}/api/search/get/web`, {
      params: {
        s: query,
        type: 1,
        limit: fetchLimit,
        offset: offset
      }
    });

    const songs = response.data.result?.songs || [];
    
    if (songs.length === 0) return [];

    // Batch check playability
    const ids = songs.map(s => s.id);
    const urlResponse = await axios.get(`${PROXY_PREFIX}/api/song/enhance/player/url`, {
        params: {
            ids: JSON.stringify(ids),
            br: 320000
        }
    });

    const urlMap = {};
    (urlResponse.data.data || []).forEach(item => {
        if (item.url) {
            urlMap[item.id] = item.url;
        }
    });

    // Filter and Map
    const validSongs = songs
        .filter(song => urlMap[song.id]) // Only keep songs with valid URLs
        .map(song => ({
            id: song.id,
            name: song.name,
            artist: song.artists ? song.artists.map(a => a.name).join(', ') : 'Unknown',
            album: song.album?.name || 'Unknown Album',
            picUrl: song.album?.picUrl || null,
            playUrl: urlMap[song.id], // Pre-fill the URL
            duration: song.duration ? song.duration / 1000 : 0,
            source: 'wy'
        }));
    
    // Return up to 'limit' songs (e.g. 10)
    // We might return fewer if many were filtered, but that's acceptable for this simple logic
    return validSongs.slice(0, limit);

  } catch (error) {
    console.error('Netease search failed:', error);
    return [];
  }
};

export const getPlayUrl = async (id, platform = 'wy') => {
    try {
        // Use the official Netease API to get the real URL
        // This avoids the 404 redirect for VIP/restricted songs
        const response = await axios.get(`${PROXY_PREFIX}/api/song/enhance/player/url`, {
            params: {
                ids: `[${id}]`,
                br: 320000 // High quality
            }
        });
        
        const url = response.data.data?.[0]?.url;
        return url || null;
    } catch (error) {
        console.error('Get play URL failed:', error);
        return null;
    }
};
