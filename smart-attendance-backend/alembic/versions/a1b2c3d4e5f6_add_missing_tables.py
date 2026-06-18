"""Add class_schedules table and profile_picture_url column

Revision ID: a1b2c3d4e5f6
Revises: 561ac151367f
Create Date: 2026-06-18 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '561ac151367f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='students' AND column_name='profile_picture_url'
            ) THEN
                ALTER TABLE students ADD COLUMN profile_picture_url VARCHAR(500);
            END IF;
        END
        $$;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS class_schedules (
            id UUID NOT NULL,
            course_id UUID NOT NULL,
            day_of_week INTEGER NOT NULL,
            start_time TIME WITHOUT TIME ZONE NOT NULL,
            end_time TIME WITHOUT TIME ZONE NOT NULL,
            room VARCHAR(100),
            created_at TIMESTAMP WITHOUT TIME ZONE,
            PRIMARY KEY (id),
            FOREIGN KEY(course_id) REFERENCES courses (id) ON DELETE CASCADE
        );
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_class_schedules_course_id 
        ON class_schedules (course_id);
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_class_schedules_course_id'), table_name='class_schedules')
    op.drop_table('class_schedules')
    # Note: we intentionally do not drop profile_picture_url on downgrade
    # to avoid accidental data loss on a column that may already have data