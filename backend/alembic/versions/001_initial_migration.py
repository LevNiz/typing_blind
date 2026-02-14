"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types (with check if they exist)
    # This is idempotent - safe to run multiple times
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'text_type') THEN
                CREATE TYPE text_type AS ENUM ('text', 'code');
            END IF;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_mode') THEN
                CREATE TYPE training_mode AS ENUM ('text', 'code');
            END IF;
        END $$;
    """)

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('username', sa.String(100), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_username', 'users', ['username'])

    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False, unique=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'])
    op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'])

    # Create texts table
    op.create_table(
        'texts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.String(10000), nullable=False),
        sa.Column('type', postgresql.ENUM('text', 'code', name='text_type', create_type=False), nullable=False),
        sa.Column('language', sa.String(50), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_texts_type', 'texts', ['type'])
    op.create_index('ix_texts_is_public', 'texts', ['is_public'])
    op.create_index('ix_texts_owner_id', 'texts', ['owner_id'])

    # Create training_sessions table
    op.create_table(
        'training_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('text_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('mode', postgresql.ENUM('text', 'code', name='training_mode', create_type=False), nullable=False),
        sa.Column('wpm', sa.Integer(), nullable=False),
        sa.Column('cpm', sa.Integer(), nullable=False),
        sa.Column('accuracy', sa.Float(), nullable=False),
        sa.Column('errors', sa.Integer(), nullable=False),
        sa.Column('correct_chars', sa.Integer(), nullable=False),
        sa.Column('duration_sec', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['text_id'], ['texts.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_training_sessions_user_id', 'training_sessions', ['user_id'])
    op.create_index('ix_training_sessions_text_id', 'training_sessions', ['text_id'])
    op.create_index('ix_training_sessions_mode', 'training_sessions', ['mode'])
    op.create_index('ix_training_sessions_created_at', 'training_sessions', ['created_at'])


def downgrade() -> None:
    # Drop tables
    op.drop_table('training_sessions')
    op.drop_table('texts')
    op.drop_table('refresh_tokens')
    op.drop_table('users')

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS training_mode")
    op.execute("DROP TYPE IF EXISTS text_type")

