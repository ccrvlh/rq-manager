"""Utility functions for consistent datetime handling across the application."""

import datetime as dt

from typing import Optional


def get_timezone_aware_now() -> dt.datetime:
    """Get current datetime as timezone-aware UTC datetime.

    Returns:
        datetime: Current datetime with UTC timezone
    """
    return dt.datetime.now(dt.UTC)


def get_timezone_aware_min() -> dt.datetime:
    """Get minimum datetime as timezone-aware UTC datetime.

    Returns:
        datetime: Minimum datetime with UTC timezone
    """
    return dt.datetime.min.replace(tzinfo=dt.UTC)


def ensure_timezone_aware(datetime_obj: Optional[dt.datetime]) -> Optional[dt.datetime]:
    """Ensure a datetime object is timezone-aware. If naive, convert to UTC.

    Args:
        datetime_obj: The datetime object to make timezone-aware

    Returns:
        datetime: Timezone-aware datetime object (UTC), or None if input was None
    """
    if datetime_obj is None:
        return None

    if datetime_obj.tzinfo is None:
        # Naive datetime - assume it's UTC and add timezone
        return datetime_obj.replace(tzinfo=dt.UTC)

    # Already timezone-aware - convert to UTC if needed
    return datetime_obj.astimezone(dt.UTC)


def ensure_timezone_naive(datetime_obj: Optional[dt.datetime]) -> Optional[dt.datetime]:
    """Ensure a datetime object is timezone-naive. If aware, convert to naive UTC.

    Args:
        datetime_obj: The datetime object to make timezone-naive

    Returns:
        datetime: Timezone-naive datetime object, or None if input was None
    """
    if datetime_obj is None:
        return None

    if datetime_obj.tzinfo is None:
        # Already naive
        return datetime_obj

    # Timezone-aware - convert to UTC then remove timezone
    utc_datetime = datetime_obj.astimezone(dt.UTC)
    return utc_datetime.replace(tzinfo=None)


def get_duration_seconds(start_time: Optional[dt.datetime], end_time: Optional[dt.datetime] = None) -> Optional[float]:
    """Calculate duration between two datetimes in seconds.

    Handles both timezone-aware and naive datetimes consistently.

    Args:
        start_time: Start datetime
        end_time: End datetime (defaults to current time if None)

    Returns:
        float: Duration in seconds, or None if start_time is None
    """
    if start_time is None:
        return None

    # Ensure both datetimes are timezone-aware for consistent comparison
    aware_start = ensure_timezone_aware(start_time)
    aware_end = ensure_timezone_aware(end_time) if end_time else get_timezone_aware_now()

    if aware_end < aware_start:
        return None

    return (aware_end - aware_start).total_seconds()
