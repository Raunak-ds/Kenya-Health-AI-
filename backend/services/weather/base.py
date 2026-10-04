"""Weather service base interface."""
from abc import ABC, abstractmethod
from typing import Optional


class WeatherData:
    def __init__(
        self,
        temperature_c: Optional[float] = None,
        humidity_pct: Optional[float] = None,
        rainfall_mm: Optional[float] = None,
        description: Optional[str] = None,
        county: Optional[str] = None,
    ):
        self.temperature_c = temperature_c
        self.humidity_pct = humidity_pct
        self.rainfall_mm = rainfall_mm
        self.description = description
        self.county = county

    def disease_risk_notes(self) -> list[str]:
        """Return risk notes based on weather conditions."""
        notes = []
        if self.humidity_pct and self.humidity_pct > 80:
            notes.append("High humidity increases risk of fungal diseases (late blight, early blight).")
        if self.rainfall_mm and self.rainfall_mm > 10:
            notes.append("Recent rainfall may spread bacterial and fungal pathogens. Monitor closely.")
        return notes


class WeatherService(ABC):
    @abstractmethod
    def get_weather(self, county: str) -> Optional[WeatherData]:
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        pass
