"""change face_encoding to vector

Revision ID: e0f1g2h3i4j5
Revises: d9e1f2a3b4c5
Create Date: 2026-06-23 17:25:00.000000

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e0f1g2h3i4j5"
down_revision: Union[str, None] = "d9e1f2a3b4c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # We must cast the existing JSON to vector if there's any data, or just alter type.
    # PostgreSQL allows changing type using USING clause.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    op.execute(
        "ALTER TABLE students ALTER COLUMN face_encoding TYPE vector(512) "
        "USING (face_encoding::text::vector);"
    )
    # Add HNSW index
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_students_face_encoding_hnsw "
        "ON students USING hnsw (face_encoding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 64);"
    )

def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_students_face_encoding_hnsw;")
    op.execute(
        "ALTER TABLE students ALTER COLUMN face_encoding TYPE JSON "
        "USING to_json(face_encoding::text);"
    )
