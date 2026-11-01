from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


# -----------------------------------------------------------------------------
# 1. Domain Exceptions
# -----------------------------------------------------------------------------
class CommandError(Exception):
    """
    Raised when a diagram command fails validation.
    Example: Trying to add a table that already exists, or renaming a non-existent column.
    """
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


# -----------------------------------------------------------------------------
# 2. Immutable Schema Primitives (Pydantic Models)
# -----------------------------------------------------------------------------
class ColumnDef(BaseModel):
    """Definition of a single column inside a database table."""
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=64, description="Column name (e.g. 'id', 'email')")
    data_type: str = Field(min_length=1, max_length=64, description="SQL data type (e.g. 'uuid', 'varchar(255)')")
    is_primary_key: bool = Field(default=False, description="True if column is part of Primary Key")
    is_nullable: bool = Field(default=True, description="True if column allows NULL values")
    is_unique: bool = Field(default=False, description="True if column has UNIQUE constraint")
    default_value: str | None = Field(default=None, description="Default SQL expression or literal")


class TableDef(BaseModel):
    """Definition of a database table containing multiple columns."""
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=64, description="Table name (e.g. 'users', 'orders')")
    columns: list[ColumnDef] = Field(default_factory=list, description="Ordered list of column definitions")
    description: str | None = Field(default=None, max_length=256, description="Optional developer notes")


class ForeignKeyDef(BaseModel):
    """Definition of a foreign key relationship between two tables."""
    model_config = ConfigDict(extra="forbid")

    name: str = Field(description="Constraint name (e.g. 'fk_orders_user_id')")
    source_table: str = Field(description="Table holding the foreign key (e.g. 'orders')")
    source_column: str = Field(description="Column in the source table (e.g. 'user_id')")
    target_table: str = Field(description="Referenced parent table (e.g. 'users')")
    target_column: str = Field(description="Referenced parent column (e.g. 'id')")
    cardinality: str = Field(default="1:N", description="Relationship cardinality: '1:1', '1:N', or 'N:M'")


# -----------------------------------------------------------------------------
# 3. Complete In-Memory Diagram State
# -----------------------------------------------------------------------------
class DiagramState(BaseModel):
    """
    Pure in-memory representation of a Diagram's current accepted state.
    
    Why Pure Model?
    This model has NO database dependencies. It represents the exact data
    that is serialized into `schema_snapshot` and `layout_snapshot` in PostgreSQL.
    """
    model_config = ConfigDict(extra="forbid")

    # Tables dictionary keyed by table name for O(1) instant lookups
    tables: dict[str, TableDef] = Field(default_factory=dict)
    
    # List of foreign key relationships
    foreign_keys: list[ForeignKeyDef] = Field(default_factory=list)

    # Layout presentation settings: node positions (x,y), sizes, and per-object color styles
    # Structure: { "nodes": { "<id>": { "x": 100, "y": 200, "style": {...} } } }
    layout: dict[str, Any] = Field(default_factory=dict)

    def with_table(self, table: TableDef) -> "DiagramState":
        """Pure helper returning a new DiagramState with the added/updated table."""
        new_tables = dict(self.tables)
        new_tables[table.name] = table
        return self.model_copy(update={"tables": new_tables})

    def without_table(self, table_name: str) -> "DiagramState":
        """Pure helper returning a new DiagramState with the specified table removed."""
        new_tables = {k: v for k, v in self.tables.items() if k != table_name}
        # Also clean up foreign keys referencing this deleted table!
        new_fks = [
            fk for fk in self.foreign_keys
            if fk.source_table != table_name and fk.target_table != table_name
        ]
        return self.model_copy(update={"tables": new_tables, "foreign_keys": new_fks})


# -----------------------------------------------------------------------------
# 4. Abstract Base Diagram Command (The Command Pattern Interface)
# -----------------------------------------------------------------------------
class DiagramCommand(BaseModel, ABC):
    """
    Abstract Base Class for all canvas operations.
    Every single mutation to a diagram MUST be an instance of DiagramCommand.
    
    Properties:
      command_id : UUID string used as an Idempotency Key (prevents duplicate execution).
      diagram_id : ID of the diagram being modified.
      actor_id   : User ID of who initiated the action (for audit tracking).
    """
    model_config = ConfigDict(extra="forbid")

    command_id: str = Field(description="Unique UUID idempotency key for this command")
    diagram_id: int = Field(description="Target diagram ID")
    actor_id: int = Field(description="User ID of the actor executing this command")

    @abstractmethod
    def validate(self, state: DiagramState) -> None:
        """
        Precondition check.
        Inspects the current DiagramState and raises CommandError if preconditions fail.
        MUST NOT mutate state or touch any database.
        """
        ...

    @abstractmethod
    def apply(self, state: DiagramState) -> DiagramState:
        """
        Pure state transformation function.
        Takes the current state in, returns the newly produced state.
        MUST NOT mutate the input state in-place.
        MUST NOT make database or network calls.
        """
        ...
