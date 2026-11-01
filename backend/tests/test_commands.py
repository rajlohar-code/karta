"""
Unit Tests for Diagram Command Pattern (Core In-Memory Domain Engine).

These are pure Unit Tests:
- 0 Network calls
- 0 Database queries
- Execute in under 10 milliseconds
"""
import pytest

from app.core.commands.base import ColumnDef, DiagramState, CommandError, TableDef
from app.core.commands.schema_commands import AddTableCommand


def test_add_table_command_success():
    """
    Unit Test:
    Adding a valid table to an empty diagram updates state and assigns layout coordinates.
    """
    initial_state = DiagramState()
    
    table = TableDef(
        name="users",
        columns=[
            ColumnDef(name="id", data_type="serial", is_primary_key=True),
            ColumnDef(name="email", data_type="varchar(255)", is_nullable=False),
        ],
        description="Users authentication table"
    )
    cmd = AddTableCommand(
        command_id="cmd_test_01",
        diagram_id=1,
        actor_id=1,
        table=table
    )
    
    # 1. Validation should pass without throwing CommandError
    cmd.validate(initial_state)
    
    # 2. Applying command should return a new state (Immutability pattern)
    new_state = cmd.apply(initial_state)
    
    # 3. Assert state changes
    assert "users" in new_state.tables
    assert len(new_state.tables["users"].columns) == 2
    assert "users" in new_state.layout["nodes"]
    
    # 4. Assert initial state was NOT modified (immutability check)
    assert len(initial_state.tables) == 0


def test_add_table_duplicate_name_is_rejected():
    """
    Unit Test:
    Adding a table with an already existing name MUST throw CommandError.
    """
    # Create state with an existing 'orders' table
    state = DiagramState()
    table1 = TableDef(name="orders", columns=[ColumnDef(name="id", data_type="int")])
    cmd1 = AddTableCommand(command_id="cmd_01", diagram_id=1, actor_id=1, table=table1)
    state = cmd1.apply(state)
    
    # Attempt to add another table also named 'orders'
    table2 = TableDef(name="orders", columns=[ColumnDef(name="id", data_type="int")])
    duplicate_cmd = AddTableCommand(command_id="cmd_02", diagram_id=1, actor_id=1, table=table2)
    
    with pytest.raises(CommandError) as exc_info:
        duplicate_cmd.validate(state)
    
    assert "already exists" in str(exc_info.value)


def test_add_table_invalid_identifier_is_rejected():
    """
    Unit Test:
    Table names with spaces, special characters, or starting with numbers must be rejected.
    """
    state = DiagramState()
    invalid_table = TableDef(
        name="123 invalid table!",
        columns=[ColumnDef(name="id", data_type="int")]
    )
    invalid_cmd = AddTableCommand(
        command_id="cmd_03",
        diagram_id=1,
        actor_id=1,
        table=invalid_table
    )
    
    with pytest.raises(CommandError) as exc_info:
        invalid_cmd.validate(state)
    
    assert "Invalid table name" in str(exc_info.value)
