"""ASGI entrypoint for the Litestar application."""

from app.app import create_app


app = create_app()
