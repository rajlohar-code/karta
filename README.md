# Karta

> **Visual thinking for developers** — Collaborative visual workspace for database schemas and flowcharts with AI assistance.

---

## Overview

Karta is a browser-based collaborative diagramming and system design platform built with a high-performance, domain-driven architecture.

### Key Capabilities
- **Database Schema & Flowchart Canvas**: Interactive node-based canvas powered by React Flow with custom `TableNode` and `FlowNode` primitives.
- **SQL Glot Round-Trip**: Visual schema to PostgreSQL DDL and reverse import.
- **Real-Time Collaboration**: Low-latency WebSocket synchronization with revision ordering and conflict prevention.
- **Pluggable AI Routing**: Two-tier cascade architecture (Groq for high-speed inference $\to$ Gemini for deep reasoning).
- **Grounded Semantic Search**: PostgreSQL full-text search combined with `pgvector` semantic embeddings.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Flow, Zustand, TanStack Query, Tailwind CSS.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2.
- **Database**: PostgreSQL with JSONB, pgvector, and tsvector.
