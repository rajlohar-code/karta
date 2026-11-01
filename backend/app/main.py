from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.log_service import log_endpoint
from app.domains.users.router import router as auth_router
from app.domains.workspaces.router import router as workspaces_router


def create_application() -> FastAPI:
    """
    Application Factory function.
    
    Why Factory Pattern?
    Instead of directly instantiating `app = FastAPI()`, we use a function.
    This makes automated testing easy: test suites can spin up separate app instances
    without sharing or leaking state across test cases.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
    )

    # -------------------------------------------------------------------------
    # CORS (Cross-Origin Resource Sharing) Middleware
    # -------------------------------------------------------------------------
    # Why is this necessary?
    # Our React frontend runs on http://localhost:5173.
    # Our FastAPI backend runs on http://localhost:8000.
    # Web browsers block requests between different ports by default for security.
    # This middleware tells the browser: "Requests from localhost:5173 are safe to allow."
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -------------------------------------------------------------------------
    # Health Check API Endpoint
    # -------------------------------------------------------------------------
    @app.get("/health", tags=["Health"])
    @log_endpoint(folder_name="health", file_name="health_check.log")
    async def health_check(request: Request):
        """
        Health Check Endpoint to verify server liveness and availability.
        
        -----------------------------------------------------------------------
        PURPOSE:
        Cloud providers (Render, Neon, Docker) ping this endpoint every few seconds
        to confirm the backend is running smoothly and ready to accept traffic.
        
        -----------------------------------------------------------------------
        REQUEST SPECIFICATION:
          - HTTP Method: GET
          - URL        : /health
          - Headers    : None required
          - Query Param: None
          - Payload    : None
            ```json
            {}
            ```
            
        -----------------------------------------------------------------------
        RESPONSE SPECIFICATION:
          - Status Code: 200 OK
          - Body JSON Schema:
            ```json
            {
              "status": "ok",
              "app": "Karta"
            }
            ```
        -----------------------------------------------------------------------
        """
        return {
            "status": "ok",
            "app": settings.PROJECT_NAME,
        }

    # -------------------------------------------------------------------------
    # Domain Routers Mounting
    # -------------------------------------------------------------------------
    # Mount the Authentication router (/api/v1/auth)
    app.include_router(auth_router)

    # Mount the Workspaces router (/api/v1/workspaces)
    app.include_router(workspaces_router)

    return app


# Instantiate the application instance for Uvicorn ASGI server
app = create_application()
