create table if not exists public.tasks (
  id uuid primary key,
  title text not null check (char_length(title) >= 3),
  description text,
  status text not null check (status in ('todo', 'in-progress', 'done')),
  priority text not null check (priority in ('low', 'medium', 'high')),
  assignee text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

-- Tidak perlu policy publik karena aplikasi mengakses tabel lewat backend/API
-- menggunakan SUPABASE_SERVICE_ROLE_KEY yang disimpan sebagai environment variable.
