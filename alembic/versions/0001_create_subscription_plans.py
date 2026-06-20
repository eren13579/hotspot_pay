"""Create subscription_plans table

Revision ID: 0001
Revises: None
Create Date: 2026-05-31
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id VARCHAR(36) PRIMARY KEY,
            plan_id VARCHAR(20) NOT NULL UNIQUE,
            name VARCHAR(50) NOT NULL,
            description VARCHAR(500),
            price INTEGER NOT NULL DEFAULT 0,
            currency VARCHAR(10) DEFAULT 'XAF',
            duration_months INTEGER DEFAULT 1,
            advantages JSON NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        )
    """)
    op.create_index("idx_sub_plan_plan_id", "subscription_plans", ["plan_id"], unique=True, if_not_exists=True)


def downgrade() -> None:
    op.drop_table("subscription_plans")
