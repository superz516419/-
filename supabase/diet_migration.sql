-- Update Profiles Table
alter table profiles 
add column if not exists height integer, -- in cm
add column if not exists weight numeric, -- in kg
add column if not exists gender text check (gender in ('male', 'female', 'other')),
add column if not exists goal text check (goal in ('cut', 'bulk', 'maintain')),
add column if not exists activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active'));

-- Create Food Logs Table
create table if not exists food_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  food_name text not null,
  calories integer not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  eaten_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Food Logs
alter table food_logs enable row level security;

create policy "Users can view own food logs" 
  on food_logs for select 
  using (auth.uid() = user_id);

create policy "Users can insert own food logs" 
  on food_logs for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own food logs" 
  on food_logs for update 
  using (auth.uid() = user_id);

create policy "Users can delete own food logs" 
  on food_logs for delete 
  using (auth.uid() = user_id);
