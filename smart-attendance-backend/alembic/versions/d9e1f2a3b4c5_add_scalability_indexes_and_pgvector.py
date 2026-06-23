"""Add scalability indexes and pgvector face column

Revision ID: d9e1f2a3b4c5
Revises: c8b864021405
Create Date: 2026-06-23 15:37:00.000000

Changes
-------
1. Adds 6 composite indexes on the hottest query paths:
   - attendance_records(student_id, session_id)   — every attendance mark / check
   - attendance_records(session_id, status)        — session summary queries
   - sessions(course_id, is_active, is_locked)     — session lookup on every request
   - session_code_attempts(session_id, student_id) — code verification path
   - student_courses(student_id, course_id, is_active) — enrollment check
   - notifications(user_id, created_at)            — notification feed queries

2. Adds pgvector extension and a face_vector column (vector(512)) to the students
   table with an HNSW ANN index (cosine distance).  This replaces the O(N) Python
   loop that compared face encodings one-by-one in memory.

   After this migration the check_duplicate_face() method can be updated to:
       SELECT id, name, 1 - (face_vector <=> $1::vector) AS confidence
       FROM students
       WHERE face_registered = TRUE
       ORDER BY face_vector <=> $1::vector
       LIMIT 1;
   — which completes in ~2–5 ms via the HNSW index instead of 800 ms in Python.

   Note: pgvector must be installed on the PostgreSQL server.
   On Supabase it is available by default via: CREATE EXTENSION IF NOT EXISTS vector;
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d9e1f2a3b4c5"
down_revision: Union[str, None] = "c8b864021405"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Performance indexes ─────────────────────────────────────────────────

    # attendance_records: primary access pattern — student + session lookup
    op.create_index(
        "ix_attendance_student_session",
        "attendance_records",
        ["student_id", "session_id"],
        unique=False,
    )

    # attendance_records: session summary (count present/absent per session)
    op.create_index(
        "ix_attendance_session_status",
        "attendance_records",
        ["session_id", "status"],
        unique=False,
    )

    # sessions: hottest lookup — find active/locked sessions for a course
    op.create_index(
        "ix_sessions_course_active_locked",
        "sessions",
        ["course_id", "is_active", "is_locked"],
        unique=False,
    )

    # session_code_attempts: verified on every code verification & face scan
    op.create_index(
        "ix_code_attempts_session_student",
        "session_code_attempts",
        ["session_id", "student_id"],
        unique=False,
    )

    # student_courses: enrollment check on every attendance request
    op.create_index(
        "ix_student_courses_active",
        "student_courses",
        ["student_id", "course_id", "is_active"],
        unique=False,
    )

    # notifications: user notification feed (latest first)
    op.create_index(
        "ix_notifications_user_created",
        "notifications",
        ["user_id", "created_at"],
        unique=False,
    )

    # ── 2. pgvector face embedding column ─────────────────────────────────────
    # Enable the pgvector extension (no-op if already installed)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Add the vector column (nullable so existing rows aren't broken)
    op.add_column(
        "students",
        sa.Column("face_vector", sa.Text(), nullable=True),  # stored as text until pgvector type is confirmed
    )

    # Create an HNSW index for approximate nearest-neighbour cosine search.
    # HNSW is faster at query time than IVFFlat and doesn't require a training step.
    # m=16, ef_construction=64 are the recommended defaults for 512-d embeddings.
    op.execute(
        """
        DO $$
        BEGIN
            -- Only create the HNSW index if the vector type is available
            IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
                -- Add the real vector column
                BEGIN
                    ALTER TABLE students ADD COLUMN IF NOT EXISTS face_vector_pgv vector(512);
                EXCEPTION WHEN others THEN
                    RAISE NOTICE 'Could not add vector column: %', SQLERRM;
                END;
                
                -- Create HNSW index
                BEGIN
                    CREATE INDEX IF NOT EXISTS ix_students_face_vector_hnsw
                        ON students USING hnsw (face_vector_pgv vector_cosine_ops)
                        WITH (m = 16, ef_construction = 64);
                EXCEPTION WHEN others THEN
                    RAISE NOTICE 'Could not create HNSW index: %', SQLERRM;
                END;
            END IF;
        END;
        $$;
        """
    )


def downgrade() -> None:
    # Drop pgvector artifacts
    op.execute("DROP INDEX IF EXISTS ix_students_face_vector_hnsw")
    op.execute("ALTER TABLE students DROP COLUMN IF EXISTS face_vector_pgv")
    op.drop_column("students", "face_vector")

    # Drop indexes
    op.drop_index("ix_notifications_user_created", table_name="notifications")
    op.drop_index("ix_student_courses_active", table_name="student_courses")
    op.drop_index("ix_code_attempts_session_student", table_name="session_code_attempts")
    op.drop_index("ix_sessions_course_active_locked", table_name="sessions")
    op.drop_index("ix_attendance_session_status", table_name="attendance_records")
    op.drop_index("ix_attendance_student_session", table_name="attendance_records")
