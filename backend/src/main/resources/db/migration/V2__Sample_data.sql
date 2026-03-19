-- Sample data for development and testing
-- Note: This migration should only be applied in development environments

-- Insert sample causes
INSERT INTO causes (id, name, description, restricted) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Environmental Conservation', 'Protecting our planet through sustainable practices and wildlife conservation', false),
    ('550e8400-e29b-41d4-a716-446655440002', 'Education for All', 'Ensuring quality education is accessible to everyone, everywhere', false),
    ('550e8400-e29b-41d4-a716-446655440003', 'Healthcare Access', 'Improving healthcare accessibility and quality in underserved communities', true),
    ('550e8400-e29b-41d4-a716-446655440004', 'Poverty Alleviation', 'Working to eliminate poverty through economic empowerment and social programs', false),
    ('550e8400-e29b-41d4-a716-446655440005', 'Mental Health Support', 'Providing mental health resources and support to those in need', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample users (password is 'password123' hashed with BCrypt)
INSERT INTO users (id, name, email, password_hash) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', 'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
    ('660e8400-e29b-41d4-a716-446655440002', 'Bob Smith', 'bob@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
    ('660e8400-e29b-41d4-a716-446655440003', 'Carol Davis', 'carol@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
    ('660e8400-e29b-41d4-a716-446655440004', 'David Wilson', 'david@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (email) DO NOTHING;

-- Insert sample cause memberships
INSERT INTO cause_memberships (user_id, cause_id, role) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'OWNER'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'ADMIN'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'MEMBER'),
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'OWNER'),
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'MEMBER'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'ADMIN'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'OWNER')
ON CONFLICT (user_id, cause_id) DO NOTHING;

-- Insert sample goals
INSERT INTO goals (id, title, description, cause_id) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 'Plant 1000 Trees', 'Community tree planting initiative to combat deforestation', '550e8400-e29b-41d4-a716-446655440001'),
    ('770e8400-e29b-41d4-a716-446655440002', 'Clean Ocean Campaign', 'Monthly beach cleanup events to protect marine life', '550e8400-e29b-41d4-a716-446655440001'),
    ('770e8400-e29b-41d4-a716-446655440003', 'Scholarship Program', 'Provide educational scholarships for underprivileged children', '550e8400-e29b-41d4-a716-446655440002'),
    ('770e8400-e29b-41d4-a716-446655440004', 'Mobile Health Clinics', 'Bring healthcare to remote and underserved areas', '550e8400-e29b-41d4-a716-446655440003'),
    ('770e8400-e29b-41d4-a716-446655440005', 'Food Security Initiative', 'Establish food banks in low-income neighborhoods', '550e8400-e29b-41d4-a716-446655440004')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, status, cause_id, goal_id, due_date) VALUES
    ('880e8400-e29b-41d4-a716-446655440001', 'Research Tree Species', 'Identify native tree species suitable for local climate', 'IN_PROGRESS', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP + INTERVAL '7 days'),
    ('880e8400-e29b-41d4-a716-446655440002', 'Secure Planting Permits', 'Obtain necessary permits from local authorities', 'COMING_UP', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP + INTERVAL '14 days'),
    ('880e8400-e29b-41d4-a716-446655440003', 'Recruit Volunteers', 'Build a team of volunteer planters', 'COMING_UP', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP + INTERVAL '21 days'),
    ('880e8400-e29b-41d4-a716-446655440004', 'Organize Beach Cleanup', 'Coordinate first monthly beach cleanup event', 'COMPLETED', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', CURRENT_TIMESTAMP - INTERVAL '5 days'),
    ('880e8400-e29b-41d4-a716-446655440005', 'Create Scholarship Criteria', 'Define eligibility requirements for scholarship recipients', 'IN_PROGRESS', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', CURRENT_TIMESTAMP + INTERVAL '10 days'),
    ('880e8400-e29b-41d4-a716-446655440006', 'Partner with Schools', 'Establish partnerships with local educational institutions', 'COMING_UP', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', CURRENT_TIMESTAMP + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;