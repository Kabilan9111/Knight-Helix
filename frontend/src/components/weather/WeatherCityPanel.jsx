import React from 'react';
import { Wind, Droplets } from 'lucide-react';

const WeatherCityCard = ({ weather, isSelected, onClick }) => {
  return (
    <button
      onClick={() => onClick(weather.city)}
      className={`w-full text-left p-4 rounded-xl transition-all duration-200 border flex flex-col gap-3 group
        ${isSelected 
          ? 'bg-[var(--accent-primary-subtle)] border-[var(--accent-primary)] shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
          : 'bg-[var(--bg-surface-2)] border-[var(--border-subtle)] hover:border-[var(--accent-primary-muted)] hover:bg-[var(--bg-surface-3)]'
        }
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-1)] flex items-center justify-center p-1 border border-[var(--border-medium)] shadow-inner">
            <img 
              src={`https://openweathermap.org/img/wn/${weather.icon}.png`} 
              alt={weather.condition} 
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
          <div>
            <h3 className={`font-semibold text-[15px] leading-tight ${isSelected ? 'text-[var(--accent-primary-light)]' : 'text-white'}`}>
              {weather.city}
            </h3>
            <p className="text-[11px] text-[var(--text-tertiary)] capitalize mt-0.5">
              {weather.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>
            {weather.temperatureC}°C
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1 pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
          <Wind size={12} className={isSelected ? 'text-[var(--accent-primary-light)]' : 'text-[var(--text-tertiary)]'} />
          <span>{weather.windKmh} km/h</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] justify-end">
          <Droplets size={12} className={isSelected ? 'text-[var(--accent-primary-light)]' : 'text-[var(--text-tertiary)]'} />
          <span>{weather.humidity}%</span>
        </div>
      </div>
    </button>
  );
};

export default function WeatherCityPanel({ weatherData, selectedCity, onSelectCity, isLoading }) {
  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-surface-1)] rounded-xl border border-[var(--border-medium)] overflow-hidden">
      <div className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-2)]">
        <h2 className="text-[16px] font-bold text-white tracking-wide">CITY WEATHER INTEL</h2>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">Major Indian cities — live conditions</p>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full h-28 rounded-xl bg-[var(--bg-surface-2)] animate-pulse border border-[var(--border-subtle)]"></div>
          ))
        ) : (
          weatherData.map((weather) => (
            <WeatherCityCard 
              key={weather.city} 
              weather={weather} 
              isSelected={selectedCity === weather.city}
              onClick={onSelectCity}
            />
          ))
        )}
      </div>
    </div>
  );
}
