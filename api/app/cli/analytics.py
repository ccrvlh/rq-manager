"""CLI commands for analytics management."""

import asyncio

import click

from app.db.repository import ManagerRepository
from app.services.snapshots import SnapshotService


@click.group()
def analytics():
    """Analytics management commands."""
    pass


@analytics.command()
@click.option('--interval', default=5, help='Collection interval in seconds')
@click.option('--duration', default=60, help='How long to run collection in seconds')
def collect(interval: int, duration: int):
    """Start analytics collection for a specified duration."""

    async def run_collection():
        analytics_service = SnapshotService()
        await analytics_service.start(interval=interval)
        await asyncio.sleep(duration)
        await analytics_service.stop()

    click.echo(f"Starting analytics collection for {duration}s with {interval}s interval...")
    asyncio.run(run_collection())
    click.echo("Collection completed!")


@analytics.command()
@click.option('--hours', default=24, help='Hours of data to show')
def stats(hours: int):
    """Show analytics statistics."""
    repo = ManagerRepository()

    queue_stats = repo.get_queue_stats(hours)
    worker_stats = repo.get_worker_stats(hours)

    click.echo(f"\n📊 Analytics Stats (last {hours} hours)")
    click.echo("=" * 50)

    click.echo(f"\n📈 Queue Metrics: {len(queue_stats)} entries")
    for stat in queue_stats[:5]:  # Show first 5
        click.echo(f"  {stat['queue_name']} ({stat['status']}): avg={stat['avg_count']:.1f}")

    click.echo(f"\n👷 Worker Metrics: {len(worker_stats)} entries")
    for stat in worker_stats[:5]:  # Show first 5
        click.echo(f"  {stat['worker_name']}: success={stat['avg_successful']:.1f}, failed={stat['avg_failed']:.1f}")


if __name__ == '__main__':
    analytics()
