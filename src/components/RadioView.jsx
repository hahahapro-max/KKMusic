import React, { useState, useEffect } from 'react';
import { Play, Loader2, Radio as RadioIcon } from 'lucide-react';
import { usePlayerStore } from '../store';

const RadioView = () => {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('Beijing');
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { playSong, currentSong, isPlaying } = usePlayerStore();

  // Fetch provinces (states)
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('https://de1.api.radio-browser.info/json/states/China');
        const data = await response.json();
        // Sort and filter empty names
        const sortedProvinces = data
          .filter(p => p.name.trim() !== '')
          .sort((a, b) => a.name.localeCompare(b.name));
        setProvinces(sortedProvinces);
      } catch (err) {
        console.error("Failed to fetch provinces", err);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch stations when province changes
  useEffect(() => {
    const fetchStations = async () => {
      if (!selectedProvince) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://de1.api.radio-browser.info/json/stations/search?limit=100&countrycode=CN&state=${encodeURIComponent(selectedProvince)}&order=clickcount&reverse=true`);
        const data = await response.json();
        setStations(data);
      } catch (err) {
        console.error("Failed to fetch stations", err);
        setError("Failed to load stations. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStations();
  }, [selectedProvince]);

  const handlePlayStation = (station) => {
    playSong({
      id: station.stationuuid,
      title: station.name,
      artist: station.state || 'China Radio',
      album: 'Live Radio',
      cover: station.favicon || 'https://lucide.dev/icons/radio', // Fallback icon
      url: station.url_resolved,
      duration: 0, // Live stream
      isRadio: true
    });
  };

  return (
    <div className="flex h-full">
      {/* Province List (Left Sidebar) */}
      <div className="w-48 border-r border-white/10 overflow-y-auto custom-scrollbar bg-black/20">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Regions</h2>
          <div className="space-y-1">
            {provinces.map((province) => (
              <button
                key={province.name}
                onClick={() => setSelectedProvince(province.name)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedProvince === province.name
                    ? 'bg-pink-500/20 text-pink-500 font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {province.name}
                <span className="float-right text-xs opacity-50">{province.stationcount}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Station Grid (Main Content) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{selectedProvince} Radio</h1>
          <p className="text-white/60">Live stations from {selectedProvince}, China</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-pink-500" size={32} />
          </div>
        ) : error ? (
          <div className="text-red-400 text-center p-8">{error}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {stations.map((station) => {
              const isCurrentStation = currentSong?.id === station.stationuuid;
              
              return (
                <div 
                  key={station.stationuuid}
                  className="group relative bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-square mb-4 bg-black/40 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {station.favicon ? (
                      <img 
                        src={station.favicon} 
                        alt={station.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = ''; // Clear src to show fallback
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex'; // Show fallback icon
                        }}
                      />
                    ) : null}
                    
                    <div 
                      className="absolute inset-0 flex items-center justify-center text-white/20"
                      style={{ display: station.favicon ? 'none' : 'flex' }}
                    >
                      <RadioIcon size={48} />
                    </div>

                    {/* Play Overlay */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                      isCurrentStation && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <button
                        onClick={() => handlePlayStation(station)}
                        className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 active:scale-95"
                      >
                        {isCurrentStation && isPlaying ? (
                          <div className="flex gap-1">
                            <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        ) : (
                          <Play size={24} fill="currentColor" className="ml-1" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-white truncate mb-1" title={station.name}>
                    {station.name}
                  </h3>
                  <p className="text-xs text-white/40 truncate">
                    {station.tags || 'Unknown Genre'}
                  </p>
                  {station.bitrate > 0 && (
                    <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      {station.bitrate}kbps
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RadioView;
