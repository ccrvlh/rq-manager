"""Analytics schemas for API requests and responses."""

import datetime as dt

from typing import Optional
from datetime import datetime
from datetime import timedelta

from msgspec import Struct


class TimePeriodParams(Struct):
    """Time period parameters for analytics queries."""

    period: Optional[str] = "24h"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    granularity: Optional[str] = "1s"

    def get_hours(self) -> int:
        """Convert string period or custom range into hours."""
        if self.start_date and self.end_date:
            delta = self.end_date - self.start_date
            return max(1, int(delta.total_seconds() / 3600))

        preset_hours = {"30m": 0.5, "1h": 1, "3h": 3, "6h": 6, "12h": 12, "24h": 24, "7d": 168, "30d": 720}
        return int(preset_hours.get(self.period or "24h", 24))

    def get_start_datetime(self) -> datetime:
        """Get the start datetime for the period."""
        if self.start_date:
            return self.start_date

        hours = self.get_hours()
        return dt.datetime.now(dt.UTC) - timedelta(hours=hours)

    def get_timedelta(self) -> timedelta:
        """Return timedelta for the selected period."""
        if self.start_date and self.end_date:
            return self.end_date - self.start_date
        presets = {
            "30m": timedelta(minutes=30),
            "1h": timedelta(hours=1),
            "3h": timedelta(hours=3),
            "6h": timedelta(hours=6),
            "12h": timedelta(hours=12),
            "24h": timedelta(hours=24),
            "7d": timedelta(days=7),
            "30d": timedelta(days=30),
            "5m": timedelta(minutes=5),
            "15m": timedelta(minutes=15),
        }
        return presets.get(self.period or "5m", timedelta(minutes=5))

    def get_granularity_format(self) -> str:
        """Return strftime format string based on granularity."""
        mapping = {
            "1s": "%Y-%m-%d %H:%M:%S",
            "5s": "%Y-%m-%d %H:%M:%S",  # still by second
            "1m": "%Y-%m-%d %H:%M:00",
            "5m": "%Y-%m-%d %H:%M:00",
            "1h": "%Y-%m-%d %H:00:00",
        }
        return mapping.get(self.granularity or "1s", "%Y-%m-%d %H:%M:%S")
