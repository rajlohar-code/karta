import re
from typing import Any
from pydantic import Field
from app.core.commands.base import (
    CommandError,
    DiagramCommand,
    DiagramState,
    TableDef,
)

# SQL table name regex validation: starts with letter, only lowercase alphanumeric and underscores
TABLE_NAME_PATTERN = re.compile(r"^[a-zA-Z][a-zA-Z0-9_]*$")


class AddTableCommand(DiagramCommand):
    """
    Command to add a new table to a database schema diagram.
    
    ---------------------------------------------------------------------------
    HOW IT WORKS:
    1. `validate()` checks:
       - Is table name formatted properly?
       - Does a table with the same name already exist?
       - Has the diagram reached the maximum table limit (e.g. 200 tables)?
    2. `apply()` returns a new DiagramState containing the new table
       and sets initial (x, y) canvas coordinates.
    ---------------------------------------------------------------------------
    """
    table: TableDef = Field(description="The complete table definition to add")
    initial_x: float = Field(default=100.0, description="Initial X canvas position in pixels")
    initial_y: float = Field(default=100.0, description="Initial Y canvas position in pixels")

    def validate(self, state: DiagramState) -> None:
        """Domain validation: verifies preconditions before applying."""
        # 1. Format check
        if not TABLE_NAME_PATTERN.match(self.table.name):
            raise CommandError(
                f"Invalid table name '{self.table.name}'. Must start with a letter and contain only alphanumeric characters and underscores."
            )

        # 2. Collision check
        if self.table.name.lower() in {t.lower() for t in state.tables.keys()}:
            raise CommandError(f"Table '{self.table.name}' already exists in this diagram.")

        # 3. Capacity limit check (DoS / resource exhaustion guard)
        if len(state.tables) >= 200:
            raise CommandError("Diagram table limit (200 tables) reached.")

    def apply(self, state: DiagramState) -> DiagramState:
        """Pure state mutation: returns a fresh DiagramState with the new table."""
        # 1. Add table to schema
        new_state = state.with_table(self.table)

        # 2. Add position to layout dictionary
        new_layout = dict(new_state.layout)
        nodes = dict(new_layout.get("nodes", {}))
        nodes[self.table.name] = {
            "x": self.initial_x,
            "y": self.initial_y,
            "width": 280,
            "height": 40 + len(self.table.columns) * 32,
            "style": None,  # System default styling (can be overridden later)
        }
        new_layout["nodes"] = nodes

        return new_state.model_copy(update={"layout": new_layout})
