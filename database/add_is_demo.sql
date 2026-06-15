-- Add is_demo flag to projects table.
-- Run this BEFORE demo_seed.sql.

alter table projects add column if not exists is_demo boolean not null default false;

comment on column projects.is_demo is 'True when this project was created by the demo seed function.';
