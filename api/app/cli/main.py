"""CLI commands module."""

import click

from .analytics import analytics


@click.group()
def cli() -> None:
    """CLI for RQ Manager."""
    pass


cli.add_command(analytics)


@cli.command()
@click.option("--host", "-h", help="Host address to bind to")
@click.option("--port", "-p", type=int, help="Port to bind to")
@click.option("--reload", "-r", is_flag=True, help="Enable auto-reload")
@click.option("--debug", "-d", is_flag=True, help="Enable debug mode")
@click.option("--workers", "-w", type=int, help="Number of worker processes")
def api(
    host: str | None = None,
    port: int | None = None,
    reload: bool | None = None,
    debug: bool | None = None,
    workers: int | None = None,
) -> None:
    """Start the API server."""
    import uvicorn

    from app.config import AppConfigBuilder
    from app.config import settings

    # Initialize settings
    builder = AppConfigBuilder(settings, "production")
    builder.load()

    # Use CLI args or fall back to config
    final_host = host or settings.APP_HOST
    final_port = port or settings.APP_PORT
    final_reload = reload if reload is not None else settings.APP_RELOAD
    final_workers = workers or settings.APP_WORKERS

    uvicorn.run(
        "app.asgi:app",
        host=final_host,
        port=final_port,
        reload=final_reload,
        workers=final_workers if not final_reload else 1,
        reload_dirs=["./api"] if final_reload else None,
    )


if __name__ == "__main__":
    cli()
