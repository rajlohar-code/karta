import functools
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from fastapi import Request

# Define the base directory for storing all logs
# Using Path(__file__).resolve() ensures the path is always accurate regardless of where the app is launched.
# This points to: d:/karta/backend/logs
BASE_LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"


def log_endpoint(folder_name: str, file_name: str):
    """
    Decorator for FastAPI route handlers that logs every API call into a file.
    
    ---------------------------------------------------------------------------
    WHAT THIS DOES:
    Whenever an API endpoint decorated with `@log_endpoint(...)` is called:
      1. It records the exact timestamp when the request arrived.
      2. It extracts incoming request details (Method, URL, Query params, JSON body).
      3. It executes the actual endpoint logic and tracks the exact execution duration (ms).
      4. It captures the outgoing response data.
      5. It appends a clean, formatted log entry into: `logs/<folder_name>/<file_name>`.
      6. If an error occurs, it logs the exception before re-raising it.
      
    ---------------------------------------------------------------------------
    PARAMETERS:
      folder_name (str): Sub-folder inside `logs/` (e.g., 'health', 'auth', 'diagrams').
      file_name   (str): Name of the log file (e.g., 'health.log', 'api.log').
      
    ---------------------------------------------------------------------------
    EXAMPLE USAGE:
      @app.get("/health")
      @log_endpoint(folder_name="health", file_name="health_check.log")
      async def health_check(request: Request):
          return {"status": "ok"}
    ---------------------------------------------------------------------------
    """

    def decorator(func: Callable) -> Callable:
        # functools.wraps preserves the original function's name, docstring, and signature.
        # This is CRITICAL for FastAPI because FastAPI reads function signatures to generate OpenAPI docs!
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            # 1. Record the start time using high-precision performance counter
            start_time = time.perf_counter()
            iso_timestamp = datetime.now(timezone.utc).isoformat()

            # 2. Extract the FastAPI Request object from kwargs or positional args
            # In FastAPI endpoints, if you declare `request: Request`, it will be passed here.
            request_obj: Request | None = None
            for arg in args:
                if isinstance(arg, Request):
                    request_obj = arg
                    break
            if not request_obj:
                for val in kwargs.values():
                    if isinstance(val, Request):
                        request_obj = val
                        break

            # 3. Gather Request metadata (Method, URL, Client IP, Query Params, Body)
            method = "UNKNOWN"
            url = "UNKNOWN"
            client_ip = "UNKNOWN"
            query_params: dict[str, Any] = {}
            request_body: Any = None

            if request_obj is not None:
                method = request_obj.method
                url = str(request_obj.url)
                client_ip = request_obj.client.host if request_obj.client else "unknown"
                query_params = dict(request_obj.query_params)

                # Attempt to parse JSON body if present
                try:
                    # Note: request.json() reads the cached body stream if already loaded
                    body_bytes = await request_obj.body()
                    if body_bytes:
                        request_body = json.loads(body_bytes.decode("utf-8"))
                except Exception:
                    # If body is not JSON or already consumed, keep as raw string or None
                    request_body = "[Unparseable or Non-JSON Body]"

            # 4. Prepare target directory and file path
            target_dir = BASE_LOG_DIR / folder_name
            os.makedirs(target_dir, exist_ok=True)
            log_file_path = target_dir / file_name

            # 5. Execute the actual endpoint and capture response or errors
            try:
                response = await func(*args, **kwargs)
                duration_ms = (time.perf_counter() - start_time) * 1000

                # Format the success log entry
                log_entry = (
                    f"================================================================================\n"
                    f"TIMESTAMP       : {iso_timestamp}\n"
                    f"ENDPOINT        : [{method}] {url}\n"
                    f"FUNCTION        : {func.__name__}\n"
                    f"CLIENT IP       : {client_ip}\n"
                    f"DURATION        : {duration_ms:.2f} ms\n"
                    f"QUERY PARAMS    : {json.dumps(query_params, default=str)}\n"
                    f"REQUEST PAYLOAD : {json.dumps(request_body, indent=2, default=str)}\n"
                    f"RESPONSE STATUS : SUCCESS (200 OK)\n"
                    f"RESPONSE DATA   : {json.dumps(response, indent=2, default=str)}\n"
                    f"================================================================================\n\n"
                )

                # Append to the log file (UTF-8 encoding)
                with open(log_file_path, mode="a", encoding="utf-8") as f:
                    f.write(log_entry)

                return response

            except Exception as exc:
                # If an error happens, calculate how long it took until failure and log the error!
                duration_ms = (time.perf_counter() - start_time) * 1000
                error_log_entry = (
                    f"================================================================================\n"
                    f"TIMESTAMP       : {iso_timestamp}\n"
                    f"ENDPOINT        : [{method}] {url}\n"
                    f"FUNCTION        : {func.__name__}\n"
                    f"CLIENT IP       : {client_ip}\n"
                    f"DURATION        : {duration_ms:.2f} ms (FAILED)\n"
                    f"QUERY PARAMS    : {json.dumps(query_params, default=str)}\n"
                    f"REQUEST PAYLOAD : {json.dumps(request_body, indent=2, default=str)}\n"
                    f"RESPONSE STATUS : ERROR\n"
                    f"ERROR DETAILS   : {type(exc).__name__}: {str(exc)}\n"
                    f"================================================================================\n\n"
                )

                with open(log_file_path, mode="a", encoding="utf-8") as f:
                    f.write(error_log_entry)

                # Re-raise so FastAPI error handlers handle the response properly
                raise exc

        return async_wrapper

    return decorator
