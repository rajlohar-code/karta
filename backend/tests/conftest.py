"""
Pytest Global Configuration & Shared Fixtures (conftest.py).

What is conftest.py?
In pytest, `conftest.py` is automatically discovered by pytest across all test files.
Any fixture defined here can be used in ANY test file in `tests/` without importing it!

What is a Fixture?
A fixture is a reusable setup/teardown function. For example:
- Spin up an HTTP test client before a test runs
- Provide the client to the test function
- Automatically close the client after the test finishes
"""
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.infra.database import engine


@pytest.fixture(autouse=True, scope="session")
async def cleanup_database_connections():
    """
    Session-level fixture:
    Gracefully disposes and closes all async database pool connections
    after the entire test suite finishes running.
    """
    yield
    await engine.dispose()


@pytest.fixture
async def client():
    """
    Reusable asynchronous HTTP client fixture for API integration tests.
    
    Why ASGITransport?
    Instead of starting a real server on port 8000 and sending real network packets,
    ASGITransport talks directly to FastAPI's in-memory ASGI application loop!
    This makes tests run 10x faster and requires no open network ports.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client
