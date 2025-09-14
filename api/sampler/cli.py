#!/usr/bin/env python3
"""
Simple CLI for RQ Sampler - just generates data, no monitoring.
"""

import click

from sampler.main import SimpleRQSampler


@click.group()
@click.option('--redis-host', default='localhost', help='Redis host')
@click.option('--redis-port', default=6379, help='Redis port')
@click.option('--redis-db', default=0, help='Redis database')
@click.option('--redis-password', default='', help='Redis password')
@click.option('--redis-url', default='', help='Redis URL (overrides other settings)')
@click.pass_context
def cli(ctx, redis_host, redis_port, redis_db, redis_password, redis_url):
    """Simple RQ Sampler CLI - generates RQ workload data."""
    ctx.ensure_object(dict)

    redis_config = {'url': redis_url, 'host': redis_host, 'port': redis_port, 'db': redis_db, 'password': redis_password}
    ctx.obj['sampler'] = SimpleRQSampler(redis_config)


@cli.command()
@click.option('--queues', default=3, help='Number of queues to create')
@click.option('--workers', default=2, help='Number of workers to start')
@click.option('--jobs-per-minute', default=10, help='Jobs to create per minute')
@click.option('--duration', default=5, help='Duration in minutes')
@click.pass_context
def generate(ctx, queues, workers, jobs_per_minute, duration):
    """Generate RQ workload data."""
    sampler = ctx.obj['sampler']

    try:
        sampler.generate_workload(
            num_queues=queues, num_workers=workers, jobs_per_minute=jobs_per_minute, duration_minutes=duration
        )
    except KeyboardInterrupt:
        print("\nStopped by user")
    finally:
        sampler.cleanup()


if __name__ == '__main__':
    cli()
