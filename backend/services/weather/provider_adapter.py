"""Weather provider adapter — selects implementation from config."""
from backend.config import settings
from backend.services.weather.base import WeatherService


def get_weather_service() -> WeatherService:
    """Factory: returns appropriate weather service based on config."""
    provider = settings.weather_provider.lower()
    if provider == "disabled" or not settings.weather_api_key:
        from backend.services.weather.mock_or_disabled import DisabledWeatherService
        return DisabledWeatherService()
    # Future: add OpenWeatherMap, TAHMO, etc. adapters here
    # elif provider == "openweathermap":
    #     from backend.services.weather.openweathermap import OpenWeatherMapService
    #     return OpenWeatherMapService(settings.weather_api_key)
    from backend.services.weather.mock_or_disabled import DisabledWeatherService
    return DisabledWeatherService()


# Module-level singleton
_weather_service = get_weather_service()


def weather_service() -> WeatherService:
    return _weather_service
