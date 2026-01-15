
// Proxy prefix configured in vite.config.js
const PROXY_PREFIX = '/netease';

export const getSongUrl = async (id) => {
  try {
    const response = await fetch(`${PROXY_PREFIX}/api/song/enhance/player/url?ids=[${id}]&br=320000`);
    if (!response.ok) throw new Error('Song URL fetch failed');
    const data = await response.json();
    return data.data?.[0]?.url || null;
  } catch (error) {
    console.error("Song URL error:", error);
    return null;
  }
};

export const searchMusic = async (query) => {
  try {
    const response = await fetch(`${PROXY_PREFIX}/api/search/get/web?s=${encodeURIComponent(query)}&type=1&offset=0&total=true&limit=1`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.result?.songs?.[0] || null;
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
};

export const getSongDetail = async (id) => {
  try {
    const response = await fetch(`${PROXY_PREFIX}/api/song/detail/?id=${id}&ids=[${id}]`);
    if (!response.ok) throw new Error('Detail fetch failed');
    const data = await response.json();
    return data.songs?.[0] || null;
  } catch (error) {
    console.error("Detail error:", error);
    return null;
  }
};

export const getLyrics = async (id) => {
  try {
    const response = await fetch(`${PROXY_PREFIX}/api/song/lyric?os=pc&id=${id}&lv=-1&kv=-1&tv=-1`);
    if (!response.ok) throw new Error('Lyrics fetch failed');
    const data = await response.json();
    return {
      original: data.lrc?.lyric || '',
      translation: data.tlyric?.lyric || ''
    };
  } catch (error) {
    console.error("Lyrics error:", error);
    return null;
  }
};

export const parseLyrics = (lyricString) => {
    if (!lyricString) return [];
    const lines = lyricString.split('\n');
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3].padEnd(3, '0'));
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();
            if (text) {
                parsed.push({ time, text });
            }
        }
    }
    return parsed;
};

export const matchAndGetMetadata = async (title, artist) => {
    try {
        const query = `${title} ${artist}`;
        const songResult = await searchMusic(query);
        
        if (songResult) {
            const [details, lyricsData] = await Promise.all([
                getSongDetail(songResult.id),
                getLyrics(songResult.id)
            ]);

            const updates = {};
            
            if (details?.album?.picUrl) {
                updates.remoteCoverUrl = details.album.picUrl;
            }

            if (lyricsData?.original) {
                updates.lyrics = lyricsData.original;
            }
            
            if (Object.keys(updates).length > 0) {
                return updates;
            }
        }
        return null;
    } catch (error) {
        console.error("Match error:", error);
        throw error;
    }
};
