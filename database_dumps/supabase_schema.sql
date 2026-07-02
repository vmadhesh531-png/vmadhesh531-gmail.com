-- Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    password TEXT
);

-- Create Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    applicant_id TEXT,
    applicant_name TEXT,
    applicant_email TEXT,
    department TEXT,
    category TEXT,
    description TEXT,
    proposed_solution TEXT,
    team_size INT,
    budget NUMERIC,
    timeline TEXT,
    expected_impact TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Submitted',
    attachments JSONB DEFAULT '[]'::jsonb,
    review_history JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security (RLS) for public access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Set Public/Anon Access Policies
CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow public read access on applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on applications" ON public.applications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on applications" ON public.applications FOR DELETE USING (true);
