"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-25

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
        sa.UniqueConstraint("username", name="uq_users_username"),
    )

    op.create_table(
        "roles",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id", name="pk_roles"),
        sa.UniqueConstraint("name", name="uq_roles_name"),
    )

    op.create_table(
        "user_roles",
        sa.Column("user_id", postgresql.UUID(), nullable=False),
        sa.Column("role_id", postgresql.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            name="fk_user_roles_role_id_roles",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_user_roles_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", "role_id", name="pk_user_roles"),
    )

    op.create_table(
        "sources",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("host", sa.String(length=255), nullable=True),
        sa.Column("port", sa.Integer(), nullable=True),
        sa.Column("database_name", sa.String(length=255), nullable=True),
        sa.Column(
            "configuration",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_by", postgresql.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "type IN ('postgresql', 'csv', 'excel', 'parquet', 'api')",
            name="type",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name="fk_sources_created_by_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_sources"),
    )

    op.create_table(
        "analyses",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sql", sa.Text(), nullable=True),
        sa.Column("database_id", sa.Integer(), nullable=True),
        sa.Column("db_schema", sa.String(length=255), nullable=True),
        sa.Column("dataset_id", sa.Integer(), nullable=True),
        sa.Column("chart_type", sa.String(length=100), nullable=True),
        sa.Column("dimension", sa.String(length=255), nullable=True),
        sa.Column("metric", sa.String(length=255), nullable=True),
        sa.Column("created_by", postgresql.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name="fk_analyses_created_by_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_analyses"),
    )

    op.create_table(
        "dashboards",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column(
            "appearance",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column("created_by", postgresql.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name="fk_dashboards_created_by_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_dashboards"),
        sa.UniqueConstraint("slug", name="uq_dashboards_slug"),
    )

    op.create_table(
        "dashboard_widgets",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("dashboard_id", postgresql.UUID(), nullable=False),
        sa.Column("analysis_id", postgresql.UUID(), nullable=False),
        sa.Column("position_x", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("position_y", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("width", sa.Integer(), nullable=False, server_default=sa.text("4")),
        sa.Column("height", sa.Integer(), nullable=False, server_default=sa.text("4")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["analysis_id"],
            ["analyses.id"],
            name="fk_dashboard_widgets_analysis_id_analyses",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["dashboard_id"],
            ["dashboards.id"],
            name="fk_dashboard_widgets_dashboard_id_dashboards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_dashboard_widgets"),
    )

    op.create_table(
        "dashboard_filters",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("dashboard_id", postgresql.UUID(), nullable=False),
        sa.Column("dataset_id", sa.Integer(), nullable=True),
        sa.Column("column_name", sa.String(length=255), nullable=False),
        sa.Column("operator", sa.String(length=50), nullable=False),
        sa.Column("default_value", sa.Text(), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["dashboard_id"],
            ["dashboards.id"],
            name="fk_dashboard_filters_dashboard_id_dashboards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_dashboard_filters"),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("user_id", postgresql.UUID(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("resource_type", sa.String(length=100), nullable=False),
        sa.Column("resource_id", postgresql.UUID(), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_audit_logs_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_audit_logs"),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("dashboard_filters")
    op.drop_table("dashboard_widgets")
    op.drop_table("dashboards")
    op.drop_table("analyses")
    op.drop_table("sources")
    op.drop_table("user_roles")
    op.drop_table("roles")
    op.drop_table("users")
