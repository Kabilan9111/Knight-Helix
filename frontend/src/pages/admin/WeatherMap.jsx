import React, { useState, useEffect, useCallback } from 'react';
import TopHeader from '../../components/TopHeader';
import WeatherMapContainer from '../../components/weather/WeatherMapContainer';
import WeatherCityPanel from '../../components/weather/WeatherCityPanel';
import WeatherStatusBar from '../../components/weather/WeatherStatusBar';
import { fetchWeatherForLocations, getWeatherDataStatus } from '../../services/weatherService';

export default function WeatherMap() {
  const [weatherData, setWeatherData] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { isLive } = getWeatherDataStatus();

  const loadWeatherData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchWeatherForLocations();
      setWeatherData(data);
      if (data.length > 0) {
        setLastUpdated(data[0].updatedAt);
      }
    } catch (err) {
      setError(
        err.message.includes('401') 
          ? 'Weather API configuration required (Invalid API Key).' 
          : 'Weather service unavailable. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWeatherData();
    
    // Auto refresh every 10 minutes (600000 ms)
    const interval = setInterval(() => {
      loadWeatherData();
    }, 600000);

    return () => clearInterval(interval);
  }, [loadWeatherData]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopHeader />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-base)] p-6 flex flex-col gap-6">
        <WeatherStatusBar 
          isLive={isLive} 
          lastUpdated={lastUpdated}
          onRefresh={() => loadWeatherData(true)}
          isRefreshing={isRefreshing}
          error={error}
        />

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Main Map Area */}
          <div className="flex-1 h-full rounded-xl overflow-hidden shadow-lg border border-[var(--border-medium)]">
            <WeatherMapContainer 
              weatherData={weatherData} 
              selectedCity={selectedCity} 
              onSelectCity={setSelectedCity} 
            />
          </div>

          {/* Right Panel */}
          <div className="w-full lg:w-80 h-full flex-shrink-0">
            <WeatherCityPanel 
              weatherData={weatherData} 
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
