import json
import logging

from litestar import Request
from litestar import Response
from litestar.types import ExceptionHandlersMap
from litestar.status_codes import HTTP_405_METHOD_NOT_ALLOWED
from litestar.status_codes import HTTP_422_UNPROCESSABLE_ENTITY
from litestar.status_codes import HTTP_500_INTERNAL_SERVER_ERROR
from litestar.exceptions.http_exceptions import NotFoundException
from litestar.exceptions.http_exceptions import ValidationException
from litestar.exceptions.http_exceptions import MethodNotAllowedException
from litestar.exceptions.http_exceptions import ImproperlyConfiguredException


logger = logging.getLogger(__name__)


def not_found_handler(request: Request, exc: Exception) -> Response:
    """Handle not found exceptions (404 errors).

    Args:
        request: The HTTP request object.
        exc: The exception that was raised.

    Returns:
        Response: A formatted error response with status and detail.
    """
    logger.info("There's been an exception: %s", exc)
    logger.debug("Route requested: %s", request.url.path)
    status_code = getattr(exc, "status_code", HTTP_500_INTERNAL_SERVER_ERROR)
    detail = getattr(exc, "detail", "")
    return Response(
        content={"status": False, "detail": detail},
        status_code=status_code,
    )


def improper_config_handler(request: Request, exc: Exception) -> Response:
    """Handle improperly configured route exceptions.

    Args:
        request: The HTTP request object.
        exc: The exception that was raised.

    Returns:
        Response: A formatted error response with generic error message.
    """
    status_code = getattr(exc, "status_code", HTTP_500_INTERNAL_SERVER_ERROR)
    detail = getattr(exc, "detail", "")
    logger.error(f"Handle for {request.url.path} is improperly configured")
    logger.error("Misconfiguration: %s", str(detail))
    return Response(
        content={"status": False, "detail": "Internal server error"},
        status_code=status_code,
    )


def validation_error_handler(request: Request, exc: Exception) -> Response:
    """Handle validation errors (422 Unprocessable Entity).

    Args:
        request: The HTTP request object.
        exc: The validation exception that was raised.

    Returns:
        Response: A formatted error response with validation details.
    """
    status_code = getattr(exc, "status_code", HTTP_422_UNPROCESSABLE_ENTITY)
    extra = getattr(exc, "extra", "")
    logger.warning("Invalid payload for route: %s %s", request.method, request.url.path)
    logger.warning("Validation error: %s, %s", extra, exc)
    payload = request._body
    if isinstance(payload, bytes):
        payload = json.loads(payload.decode("utf-8"))
    logger.warning("Payload: %s", payload)
    return Response(
        content={"status": False, "message": "Validation error", "details": extra},
        status_code=status_code,
    )


def method_not_allowed_exception_handler(request: Request, exc: Exception) -> Response:
    """Handle method not allowed exceptions (405).

    Args:
        request: The HTTP request object.
        exc: The method not allowed exception.

    Returns:
        Response: A formatted error response indicating method not allowed.
    """
    status_code = getattr(exc, "status_code", HTTP_405_METHOD_NOT_ALLOWED)
    logger.warning(f"Method {request.method} not allowed for {request.url.path}")
    return Response(
        status_code=status_code,
        content={"status": False, "detail": "Method not allowed"},
    )


def generic_exception_handler(request: Request, exc: Exception) -> Response:
    """Handle generic exceptions as a fallback handler.

    Args:
        request: The HTTP request object.
        exc: The exception that was raised.

    Returns:
        Response: A formatted error response with exception details.
    """
    status_code = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", "")
    if status_code == 500:
        logger.error(f"There has been an unknown exception when handling {request.method} {request.url.path}")
        logger.error("Full Exception Traceback:", exc_info=True)
    return Response(
        content={"status": False, "detail": detail},
        status_code=status_code,
    )


exception_handlers: ExceptionHandlersMap = {
    NotFoundException: not_found_handler,
    ImproperlyConfiguredException: improper_config_handler,
    ValidationException: validation_error_handler,
    MethodNotAllowedException: method_not_allowed_exception_handler,
    Exception: generic_exception_handler,
}
