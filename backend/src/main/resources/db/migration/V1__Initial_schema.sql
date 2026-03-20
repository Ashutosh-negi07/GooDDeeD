-- Initial schema creation for GooDDeeD application
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create causes table
CREATE TABLE IF NOT EXISTS causes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    restricted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cause_id UUID NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create task_status enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM (
            'COMING_UP',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED'
        );
    END IF;
END $$;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'COMING_UP',
    cause_id UUID NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create role enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'MEMBER',
            'ADMIN',
            'OWNER'
        );
    END IF;
END $$;

-- Create cause_memberships table (junction table for users and causes)
CREATE TABLE IF NOT EXISTS cause_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cause_id UUID NOT NULL REFERENCES causes(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'MEMBER',
    approved BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cause_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_cause_id ON tasks(cause_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_goals_cause_id ON goals(cause_id);
CREATE INDEX IF NOT EXISTS idx_cause_memberships_user_id ON cause_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_cause_memberships_cause_id ON cause_memberships(cause_id);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Application users';
COMMENT ON TABLE causes IS 'Charitable causes that users can join';
COMMENT ON TABLE goals IS 'Goals associated with specific causes';
COMMENT ON TABLE tasks IS 'Tasks that help achieve goals within causes';
COMMENT ON TABLE cause_memberships IS 'Junction table linking users to causes with their roles';