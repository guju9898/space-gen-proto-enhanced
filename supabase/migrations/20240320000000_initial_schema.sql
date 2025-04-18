-- Create users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  credits integer default 10 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create renders table
create table public.renders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  render_type text not null,
  config jsonb not null,
  source_image_url text,
  result_image_url text,
  prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.users enable row level security;
alter table public.renders enable row level security;

create policy "Users can view their own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can view their own renders"
  on public.renders for select
  using (auth.uid() = user_id);

create policy "Users can create their own renders"
  on public.renders for insert
  with check (auth.uid() = user_id);

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

create trigger handle_renders_updated_at
  before update on public.renders
  for each row
  execute function public.handle_updated_at(); 