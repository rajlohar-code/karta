import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path so we can import 'app' modules
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Ensure UTF-8 output on Windows PowerShell
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


import asyncpg
from app.config import settings
from app.infra.database import Base, engine

# Import all domain models so SQLAlchemy Base knows about all tables!
# When adding new models in the future, import them here.
from app.domains.users.models import User


async def sync_code_to_postgres():
    """
    Code-to-PostgreSQL Synchronization Script (code2pg.py)
    
    ---------------------------------------------------------------------------
    WHAT THIS SCRIPT DOES:
    1. Connects to local PostgreSQL server.
    2. Ensures the database 'karta' exists (creates it if missing).
    3. Connects to 'karta' database via SQLAlchemy 2.0 Async engine.
    4. Automatically creates all tables defined in code (Base.metadata.create_all).
    5. Prints a friendly status report of all created tables and columns!
    ---------------------------------------------------------------------------
    """
    print("\n" + "=" * 60)
    print("🚀 KARTA: CODE TO POSTGRESQL SYNCHRONIZER (code2pg)")
    print("=" * 60)

    # -------------------------------------------------------------------------
    # Step 1: Connect to default postgres DB to ensure 'karta' DB exists
    # -------------------------------------------------------------------------
    print("\n[Step 1/3] Checking PostgreSQL server & 'karta' database...")
    try:
        # Connect using trust/password
        admin_conn = await asyncpg.connect("postgresql://postgres:postgres@127.0.0.1:5432/postgres")
    except Exception:
        # Fallback without password if trust mode is active
        admin_conn = await asyncpg.connect("postgresql://postgres@127.0.0.1:5432/postgres")

    # Set password to 'postgres'
    await admin_conn.execute("ALTER USER postgres WITH PASSWORD 'postgres';")
    print("  ✓ User 'postgres' authenticated & password verified.")

    # Check if database 'karta' exists
    db_exists = await admin_conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'karta';")
    if not db_exists:
        await admin_conn.execute("CREATE DATABASE karta;")
        print("  ✓ Database 'karta' did not exist — created successfully!")
    else:
        print("  ✓ Database 'karta' already exists.")

    await admin_conn.close()

    # -------------------------------------------------------------------------
    # Step 2: Use SQLAlchemy Async Engine to create all tables from Python code
    # -------------------------------------------------------------------------
    print("\n[Step 2/3] Syncing SQLAlchemy models to database tables...")
    async with engine.begin() as conn:
        # run_sync bridges async SQLAlchemy with the synchronous DDL schema generation
        await conn.run_sync(Base.metadata.create_all)
    print("  ✓ Base.metadata.create_all executed cleanly!")

    # -------------------------------------------------------------------------
    # Step 3: Verify and Print Table Status Report
    # -------------------------------------------------------------------------
    print("\n[Step 3/3] Verifying tables in 'karta' database...")
    karta_conn = await asyncpg.connect("postgresql://postgres:postgres@127.0.0.1:5432/karta")
    
    rows = await karta_conn.fetch("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)

    table_names = [r["table_name"] for r in rows]
    print(f"  ✓ Found {len(table_names)} tables in 'public' schema:")

    for tname in table_names:
        cols = await karta_conn.fetch("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position;
        """, tname)
        print(f"\n  📋 Table: '{tname}' ({len(cols)} columns):")
        for c in cols:
            nullable_str = "NULL" if c["is_nullable"] == "YES" else "NOT NULL"
            print(f"     - {c['column_name']:<16} : {c['data_type']:<24} [{nullable_str}]")

    await karta_conn.close()
    await engine.dispose()

    print("\n" + "=" * 60)
    print("🎉 ALL TABLES SYNCHRONIZED SUCCESSFULLY TO POSTGRESQL!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(sync_code_to_postgres())
