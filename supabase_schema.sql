-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for Teams
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    stars_found INTEGER DEFAULT 0,
    solved_indices INTEGER[] DEFAULT '{}',
    attempts JSONB DEFAULT '{}'::jsonb,
    forget_password_clicked BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Game Configuration (Global locks)
CREATE TABLE public.game_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    sections_1_2_unlocked BOOLEAN DEFAULT FALSE,
    section_3_unlocked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Verification Requests
CREATE TABLE public.verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name TEXT NOT NULL,
    star_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    type TEXT NOT NULL,
    submitted_answer TEXT,
    section INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial admin and config
INSERT INTO public.game_config (id, sections_1_2_unlocked, section_3_unlocked) 
VALUES (1, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Initial Admin (Change password immediately!)
INSERT INTO public.teams (name, password, role) 
VALUES ('Admin', 'D0bbyTar5', 'admin')
ON CONFLICT (name) DO NOTHING;
