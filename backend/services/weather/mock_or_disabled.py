"""Disabled/mock weather provider. Used when no API key is configured."""
from typing import Optional
from backend.services.weather.base import WeatherService, WeatherData


class DisabledWeatherService(WeatherService):
    """No-op weather service. System works fully without weather data."""

    @property
    def is_available(self) -> bool:
        return False

    def get_weather(self, county: str) -> Optional[WeatherData]:
        return None
