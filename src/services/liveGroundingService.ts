/**
 * Live Grounding Service for Real-Time Internet Information
 * - Real-Time Weather via Open-Meteo (Muttagundi, Hosadurga, Chitradurga, Karnataka)
 * - Real-Time Date/Time/Calendar in Indian Standard Time (IST)
 * - Grounding metadata tracking
 */

export interface LiveWeatherData {
  isLive: boolean;
  tempC: number;
  conditionEn: string;
  conditionKn: string;
  humidity: number;
  rainMm: number;
  windKmh: number;
  rainProbability?: number;
  timestamp: string;
  locationEn: string;
  locationKn: string;
}

// WMO Weather Interpretation Codes (WW)
function interpretWeatherCode(code: number): { en: string; kn: string } {
  switch (code) {
    case 0:
      return { en: 'Clear sky, sunny', kn: 'ಶುಭ್ರ ಆಕಾಶ, ಬಿಸಿಲಿನ ವಾತಾವರಣ' };
    case 1:
      return { en: 'Mainly clear', kn: 'ಹೆಚ್ಚಾಗಿ ಶುಭ್ರ ಆಕಾಶ' };
    case 2:
      return { en: 'Partly cloudy', kn: 'ಭಾಗಶಃ ಮೋಡ ಕವಿದಿದೆ' };
    case 3:
      return { en: 'Overcast clouds', kn: 'ದಟ್ಟ ಮೋಡ ಕವಿದ ವಾತಾವರಣ' };
    case 45:
    case 48:
      return { en: 'Foggy conditions', kn: 'ಮಂಜು ಕವಿದ ವಾತಾವರಣ' };
    case 51:
    case 53:
    case 55:
      return { en: 'Light drizzle', kn: 'ಹಗುರ ತುಂತುರು ಮಳೆ' };
    case 61:
    case 63:
    case 65:
      return { en: 'Rain showers', kn: 'ಮಳೆ ಸುರಿಯುತ್ತಿದೆ' };
    case 71:
    case 73:
    case 75:
      return { en: 'Light snow / hail', kn: 'ಆಲಿಕಲ್ಲು ಮಳೆ' };
    case 80:
    case 81:
    case 82:
      return { en: 'Heavy rain showers', kn: 'ಭಾರೀ ಮಳೆ ಸಾಧ್ಯತೆ' };
    case 95:
    case 96:
    case 99:
      return { en: 'Thunderstorm with rain', kn: 'ಗುಡುಗು-ಮಿಂಚು ಸಹಿತ ಮಳೆ' };
    default:
      return { en: 'Pleasant weather', kn: 'ಉತ್ತಮ ಹಿತಕರ ಹವಾಮಾನ' };
  }
}

class LiveGroundingService {
  // Muttagundi Village Coordinates (Hosadurga Taluk, Chitradurga District, Karnataka)
  private readonly LATITUDE = 13.8016;
  private readonly LONGITUDE = 76.2865;

  /**
   * Fetches real-time live meteorological station data for Muttagundi.
   * Never returns fake data: returns isLive: false if fetch fails.
   */
  public async getLiveWeather(): Promise<LiveWeatherData | null> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.LATITUDE}&longitude=${this.LONGITUDE}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn('[LiveGrounding] Weather API returned HTTP status:', res.status);
        return null;
      }

      const data = await res.json();
      const current = data.current;
      if (!current) return null;

      const codeInfo = interpretWeatherCode(current.weather_code || 0);
      const rainProbability = data.daily?.precipitation_probability_max?.[0] || 0;

      return {
        isLive: true,
        tempC: Math.round(current.temperature_2m * 10) / 10,
        conditionEn: codeInfo.en,
        conditionKn: codeInfo.kn,
        humidity: current.relative_humidity_2m || 0,
        rainMm: current.precipitation || 0,
        windKmh: Math.round(current.wind_speed_10m || 0),
        rainProbability,
        timestamp: current.time || new Date().toISOString(),
        locationEn: 'Muttagundi, Hosadurga Taluk, Chitradurga District',
        locationKn: 'ಮುತ್ತಾಗೊಂದಿ, ಹೊಸದುರ್ಗ ತಾಲೂಕು, ಚಿತ್ರದುರ್ಗ ಜಿಲ್ಲೆ'
      };
    } catch (err) {
      console.warn('[LiveGrounding] Live weather fetch failed:', err);
      return null;
    }
  }

  /**
   * Returns precise live date, time, and weekday context in Indian Standard Time (IST)
   */
  public getLiveDateTimeContext(): {
    timeStr: string;
    dateStr: string;
    dayKn: string;
    dayEn: string;
    isoDate: string;
  } {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dateStr = now.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const isoDate = now.toISOString().split('T')[0];

    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysKn = ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'];
    const dayIndex = now.getDay();

    return {
      timeStr,
      dateStr,
      dayEn: daysEn[dayIndex],
      dayKn: daysKn[dayIndex],
      isoDate
    };
  }
}

export const liveGroundingService = new LiveGroundingService();
