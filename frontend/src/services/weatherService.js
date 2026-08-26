import { WEATHER_LOCATIONS, DEMO_WEATHER_DATA } from '../data/demoWeatherData';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const IS_DEMO = !API_KEY || API_KEY === 'YOUR_OPENWEATHER_API_KEY_HERE';

const titleCase = (str) => str.replace(/\b\w/g, c => c.toUpperCase());

export const fetchWeatherForLocations = async () => {
  if (IS_DEMO) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    // Return cloned demo data to ensure fresh timestamps
    const now = new Date().toISOString();
    return WEATHER_LOCATIONS.map(loc => ({
      ...DEMO_WEATHER_DATA[loc.id],
      updatedAt: now
    }));
  }

  try {
    const promises = WEATHER_LOCATIONS.map(async (loc) => {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&units=metric&appid=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        id: loc.id,
        city: loc.name,
        coordinates: { lat: loc.lat, lon: loc.lon },
        temperatureC: Math.round(data.main.temp),
        feelsLikeC: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        windKmh: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        condition: data.weather[0].main,
        description: titleCase(data.weather[0].description),
        icon: data.weather[0].icon,
        source: 'openweather',
        updatedAt: new Date().toISOString()
      };
    });

    return await Promise.all(promises);
  } catch (error) {
    console.error('Failed to fetch live weather data:', error);
    throw error;
  }
};

export const getWeatherDataStatus = () => {
  return {
    isLive: !IS_DEMO
  };
};
