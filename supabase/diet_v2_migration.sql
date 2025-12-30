-- Update Profiles Table with new fields
alter table profiles 
add column if not exists age integer; -- Age wasn't in original schema

-- Ensure other columns exist (idempotent)
alter table profiles 
add column if not exists height integer, 
add column if not exists weight numeric, 
add column if not exists gender text check (gender in ('male', 'female')),
add column if not exists goal text check (goal in ('cut', 'bulk', 'maintain')),
add column if not exists activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active'));
