-- Prime Builder — Supabase schema
-- Run this once in the Supabase SQL Editor (SQL Editor → New Query → paste → Run)

create table if not exists properties (
  id bigint generated always as identity primary key,
  title text not null,
  bhk text not null,
  locality text not null,
  price_value numeric not null,
  price_label text not null,
  area_sqft text not null,
  floor text,
  facing text,
  bathrooms text,
  status text default 'Available',
  is_featured boolean default false,
  description text,
  amenities jsonb default '[]'::jsonb,
  images jsonb default '[]'::jsonb,
  units_available text,
  created_at timestamptz default now()
);

create table if not exists gallery_items (
  id bigint generated always as identity primary key,
  type text not null,
  filename text,
  youtube_id text,
  caption text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists homepage_videos (
  id bigint generated always as identity primary key,
  title text,
  video_filename text,
  cover_filename text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists testimonials (
  id bigint generated always as identity primary key,
  name text not null,
  locality text,
  quote text not null,
  rating integer default 5,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists blog_posts (
  id bigint generated always as identity primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  body text not null,
  cover_url text,
  published boolean default false,
  created_at timestamptz default now(),
  published_at timestamptz
);

create table if not exists inquiries (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  email text,
  budget text,
  message text,
  property_id bigint,
  status text default 'New',
  created_at timestamptz default now()
);

create table if not exists site_settings (
  key text primary key,
  value text
);
