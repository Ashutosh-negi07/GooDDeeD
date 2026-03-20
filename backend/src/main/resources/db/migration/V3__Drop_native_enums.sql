-- V3: Replace native PostgreSQL enum columns with VARCHAR
-- This eliminates the varchar->enum type casting issue with Hibernate/JPA
-- when using @Enumerated(EnumType.STRING)

-- Step 1: Convert tasks.status from task_status enum to VARCHAR(20)
ALTER TABLE tasks
    ALTER COLUMN status SET DATA TYPE VARCHAR(20)
    USING status::text;

ALTER TABLE tasks
    ALTER COLUMN status SET DEFAULT 'COMING_UP';

-- Step 2: Convert cause_memberships.role from user_role enum to VARCHAR(20)
ALTER TABLE cause_memberships
    ALTER COLUMN role SET DATA TYPE VARCHAR(20)
    USING role::text;

ALTER TABLE cause_memberships
    ALTER COLUMN role SET DEFAULT 'MEMBER';

-- Step 3: Drop the native enum types (no longer needed)
DROP TYPE IF EXISTS task_status;
DROP TYPE IF EXISTS user_role;
