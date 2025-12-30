-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." 
  on profiles for select 
  using (true);

create policy "Users can insert their own profile." 
  on profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile." 
  on profiles for update 
  using (auth.uid() = id);

-- 2. Exercises Table
create table exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  body_part text,
  user_id uuid references auth.users(id) on delete cascade, -- nullable for global exercises
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table exercises enable row level security;

-- Global exercises (user_id is null) are viewable by everyone. Custom ones by owner.
create policy "Exercises viewable by everyone or owner" 
  on exercises for select 
  using (user_id is null or auth.uid() = user_id);

create policy "Users can create custom exercises" 
  on exercises for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own exercises" 
  on exercises for update 
  using (auth.uid() = user_id);

create policy "Users can delete own exercises" 
  on exercises for delete 
  using (auth.uid() = user_id);

-- 3. Routines Table
create table routines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table routines enable row level security;

create policy "Users can view own routines" 
  on routines for select 
  using (auth.uid() = user_id);

create policy "Users can insert own routines" 
  on routines for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own routines" 
  on routines for update 
  using (auth.uid() = user_id);

create policy "Users can delete own routines" 
  on routines for delete 
  using (auth.uid() = user_id);

-- 4. Routine Exercises Table
create table routine_exercises (
  id uuid default uuid_generate_v4() primary key,
  routine_id uuid references routines(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  "order" integer not null,
  target_sets integer,
  target_reps integer,
  rest_seconds integer
);

alter table routine_exercises enable row level security;

-- Policies for routine_exercises rely on the ownership of the parent routine
create policy "Users can view own routine exercises" 
  on routine_exercises for select 
  using (
    exists (select 1 from routines where id = routine_exercises.routine_id and user_id = auth.uid())
  );

create policy "Users can insert own routine exercises" 
  on routine_exercises for insert 
  with check (
    exists (select 1 from routines where id = routine_exercises.routine_id and user_id = auth.uid())
  );

create policy "Users can update own routine exercises" 
  on routine_exercises for update 
  using (
    exists (select 1 from routines where id = routine_exercises.routine_id and user_id = auth.uid())
  );

create policy "Users can delete own routine exercises" 
  on routine_exercises for delete 
  using (
    exists (select 1 from routines where id = routine_exercises.routine_id and user_id = auth.uid())
  );

-- 5. Workouts Table
create table workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_id uuid references routines(id) on delete set null,
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  status text check (status in ('in_progress', 'completed', 'cancelled')) default 'in_progress'
);

alter table workouts enable row level security;

create policy "Users can view own workouts" 
  on workouts for select 
  using (auth.uid() = user_id);

create policy "Users can insert own workouts" 
  on workouts for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own workouts" 
  on workouts for update 
  using (auth.uid() = user_id);

create policy "Users can delete own workouts" 
  on workouts for delete 
  using (auth.uid() = user_id);

-- 6. Workout Sets Table
create table workout_sets (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references workouts(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  set_number integer not null,
  weight_kg numeric,
  reps integer,
  completed_at timestamp with time zone default timezone('utc'::text, now())
);

alter table workout_sets enable row level security;

-- Policies for workout_sets rely on the ownership of the parent workout
create policy "Users can view own workout sets" 
  on workout_sets for select 
  using (
    exists (select 1 from workouts where id = workout_sets.workout_id and user_id = auth.uid())
  );

create policy "Users can insert own workout sets" 
  on workout_sets for insert 
  with check (
    exists (select 1 from workouts where id = workout_sets.workout_id and user_id = auth.uid())
  );

create policy "Users can update own workout sets" 
  on workout_sets for update 
  using (
    exists (select 1 from workouts where id = workout_sets.workout_id and user_id = auth.uid())
  );

create policy "Users can delete own workout sets" 
  on workout_sets for delete 
  using (
    exists (select 1 from workouts where id = workout_sets.workout_id and user_id = auth.uid())
  );

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
