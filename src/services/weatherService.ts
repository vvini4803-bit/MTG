/**
 * Real-time Weather Service for Muttagundi Village (ಮುತ್ತಾಗೊಂದಿ ಗ್ರಾಮ)
 * Coordinates: Latitude 13.7562, Longitude 76.3335 (Hosadurga Taluk, Chitradurga, Karnataka)
 * Grounded strictly to Muttagundi local weather using high-resolution Open-Meteo API.
 */

export interface MuttagundiWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  conditionKn: string;
  conditionEn: string;
  iconEmoji: string;
  lastUpdated: string;
  isLive: boolean;
}

export const MUTTAGUNDI_COORDS = {
  lat: 13.7562,
  lng: 76.3335,
  elevationMeters: 742,
  villageNameKn: 'ಮುತ್ತಾಗೊಂದಿ',
  villageNameEn: 'Muttagundi',
  talukKn: 'ಹೊಸದುರ್ಗ',
  talukEn: 'Hosadurga',
  districtKn: 'ಚಿತ್ರದುರ್ಗ',
  districtEn: 'Chitradurga'
};

export function getWeatherCondition(code: number, isDay: boolean = true): { kn: string; en: string; icon: string } {
  switch (code) {
    case 0:
      return isDay
        ? { kn: 'ಶುಭ್ರ ಬಿಸಿಲು', en: 'Clear Sunny', icon: '☀️' }
        : { kn: 'ಶುಭ್ರ ರಾತ್ರಿ', en: 'Clear Night', icon: '🌙' };
    case 1:
      return isDay
        ? { kn: 'ಬಹುತೇಕ ಶುಭ್ರ', en: 'Mainly Clear', icon: '🌤️' }
        : { kn: 'ಶಾಂತ ರಾತ್ರಿ', en: 'Mainly Clear', icon: '🌙' };
    case 2:
      return { kn: 'ಭಾಗಶಃ ಮೋಡ', en: 'Partly Cloudy', icon: '⛅' };
    case 3:
      return { kn: 'ಮೋಡ ಕವಿದಿದೆ', en: 'Overcast', icon: '☁️' };
    case 45:
    case 48:
      return { kn: 'ಮಂಜು ಕವಿದಿದೆ', en: 'Foggy / Mist', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { kn: 'ತುಂತುರು ಮಳೆ', en: 'Light Drizzle', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { kn: 'ಸಾಧಾರಣ ಮಳೆ', en: 'Rainy', icon: '🌧️' };
    case 80:
    case 81:
    case 82:
      return { kn: 'ಮಳೆ ಸಿಂಚನ', en: 'Rain Showers', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { kn: 'ಗುಡುಗು ಸಹಿತ ಮಳೆ', en: 'Thunderstorm', icon: '⛈️' };
    default:
      return { kn: 'ಹಿತಕರ ಹವೆ', en: 'Pleasant Weather', icon: '🌤️' };
  }
}

const FALLBACK_WEATHER: MuttagundiWeather = {
  temperature: 24,
  apparentTemperature: 25,
  humidity: 72,
  windSpeed: 14,
  precipitation: 0.0,
  weatherCode: 1,
  isDay: true,
  conditionKn: 'ಹಿತಕರ ವಾತಾವರಣ',
  conditionEn: 'Pleasant & Mild',
  iconEmoji: '🌤️',
  lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  isLive: false
};

const CACHE_KEY = 'mtg_muttagundi_weather_cache_v1';

export async function fetchMuttagundiLiveWeather(): Promise<MuttagundiWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${MUTTAGUNDI_COORDS.lat}&longitude=${MUTTAGUNDI_COORDS.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Weather fetch failed: ${res.status}`);
    }

    const data = await res.json();
    const curr = data?.current;

    if (!curr) {
      throw new Error('Malformed weather response');
    }

    const weatherCode = typeof curr.weather_code === 'number' ? curr.weather_code : 1;
    const isDay = curr.is_day === 1;
    const condition = getWeatherCondition(weatherCode, isDay);

    const weather: MuttagundiWeather = {
      temperature: Math.round(curr.temperature_2m),
      apparentTemperature: Math.round(curr.apparent_temperature),
      humidity: Math.round(curr.relative_humidity_2m),
      windSpeed: Math.round(curr.wind_speed_10m),
      precipitation: curr.precipitation ?? 0,
      weatherCode,
      isDay,
      conditionKn: condition.kn,
      conditionEn: condition.en,
      iconEmoji: condition.icon,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isLive: true
    };

    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: weather,
          timestamp: Date.now()
        })
      );
    } catch {}

    return weather;
  } catch (err) {
    console.warn('[WeatherService] Live weather fetch failed, checking cache:', err);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data) {
          return { ...parsed.data, isLive: false };
        }
      }
    } catch {}
    return { ...FALLBACK_WEATHER };
  }
}

export function subscribeMuttagundiWeather(callback: (weather: MuttagundiWeather) => void): () => void {
  // 1. Send cached or fallback immediately
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.data) {
        callback({ ...parsed.data, isLive: false });
      } else {
        callback(FALLBACK_WEATHER);
      }
    } else {
      callback(FALLBACK_WEATHER);
    }
  } catch {
    callback(FALLBACK_WEATHER);
  }

  // 2. Fetch fresh live weather immediately
  fetchMuttagundiLiveWeather().then((live) => {
    callback(live);
  });

  // 3. Poll every 15 minutes for live update
  const interval = setInterval(() => {
    fetchMuttagundiLiveWeather().then((live) => {
      callback(live);
    });
  }, 15 * 60 * 1000);

  return () => clearInterval(interval);
}
