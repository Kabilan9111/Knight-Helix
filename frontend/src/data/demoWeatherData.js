export const WEATHER_LOCATIONS = [
  { id: 'chennai', name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { id: 'mumbai', name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { id: 'delhi', name: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { id: 'bengaluru', name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { id: 'hyderabad', name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { id: 'kolkata', name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { id: 'pune', name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { id: 'ahmedabad', name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 }
];

export const DEMO_WEATHER_DATA = {
  chennai: {
    city: 'Chennai',
    coordinates: { lat: 13.0827, lon: 80.2707 },
    temperatureC: 36,
    feelsLikeC: 39,
    humidity: 60,
    windKmh: 15,
    condition: 'Clouds',
    description: 'Overcast Clouds',
    icon: '04d',
    source: 'demo',
    updatedAt: new Date().toISOString()
  },
  mumbai: {
    city: 'Mumbai',
    coordinates: { lat: 19.0760, lon: 72.8777 },
    temperatureC: 31,
    feelsLikeC: 34,
    humidity: 70,
    windKmh: 26,
    condition: 'Rain',
    description: 'Light Rain',
    icon: '10d',
    source: 'demo',
    updatedAt: new Date().toISOString()
  },
  delhi: {
    city: 'Delhi',
    coordinates: { lat: 28.7041, lon: 77.1025 },
    temperatureC: 34,
    feelsLikeC: 36,
    humidity: 66,
    windKmh: 20,
    condition: 'Clouds',
    description: 'Broken Clouds',
    icon: '04d',
    source: 'demo',
    updatedAt: new Date().toISOString()
  },
  bengaluru: {
    city: 'Bengaluru',
    coordinates: { lat: 12.9716, lon: 77.5946 },
    temperatureC: 28,
    feelsLikeC: 30,
    humidity: 66,
    windKmh: 15,
    condition: 'Clouds',
    description: 'Broken Clouds',
    icon: '04d',
    source: 'demo',
    updatedAt: new Date().toISOString()
  },
  hyderabad: {
    city: 'Hyderabad',
    coordinates: { lat: 17.3850, lon: 78.4867 },
    temperatureC: 30,
    feelsLikeC: 32,
    humidity: 60,
    windKmh: 28,
    condition: 'Clouds',
    description: 'Broken Clouds',
    icon: '04d',
    source: 'demo',
    updatedAt: new Date().toISOString()
  },
  kolkata: {
    city: 'Kolkata',
    coordinates: { lat: 22.5726, lon: 88.3639 },
    temperatureC: 29,
    feelsLikeC: 31,
    humidity: 84,
    windKmh: 11,
    condition: 'Rain',
    description: 'Light Rain',
    icon: '10d',
    source: 'demo',
    updatedAt: new Date().toISOString()
  },
  pune: {
    city: 'Pune',
    coordinates: { lat: 18.5204, lon: 73.8567 },
    temperatureC: 29,
    feelsLikeC: 31,
    humidity: 65,
    windKmh: 18,
    condition: 'Clouds',
    description: 'Cloudy',
    icon: '03d',
    source: 'demo',
    updatedAt: new Date().toISOString()
  },
  ahmedabad: {
    city: 'Ahmedabad',
    coordinates: { lat: 23.0225, lon: 72.5714 },
    temperatureC: 32,
    feelsLikeC: 33,
    humidity: 55,
    windKmh: 20,
    condition: 'Clear',
    description: 'Clear',
    icon: '01d',
    source: 'demo',
    updatedAt: new Date().toISOString()
  }
};
