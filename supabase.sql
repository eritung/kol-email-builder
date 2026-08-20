-- ====================================================================
-- KOL 合作邀約信件產生器 - Supabase 資料表建立腳本
-- 到 Supabase 專案的左側選單「SQL Editor」，貼上這整段後按 Run 執行一次即可。
-- ====================================================================

-- gen_random_uuid() 需要這個 extension（Supabase 專案通常預設就有，這行是保險）
create extension if not exists pgcrypto;

-- 課程資料表：每一筆是一份「課程/KOL 信件」的完整表單資料（存成 jsonb）
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 每次 UPDATE 時自動把 updated_at 更新成現在時間
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security（存取權限）
-- ---------------------------------------------------------------------
-- 這裡設定成「只要有這個專案的 anon public key，就能讀寫」，
-- 適合團隊內部小工具、資料不涉及個資或機密的情境。
--
-- 注意：anon key 會被放在前端程式碼裡（任何人打開網頁原始碼都看得到），
-- 開放這樣的政策等於「知道網址+anon key 的人都能新增/修改/刪除課程資料」。
-- 如果之後想要「只有登入的團隊成員才能編輯」，可以改用 Supabase Auth，
-- 並把下面政策的 using (true) 換成 using (auth.role() = 'authenticated')。
-- ---------------------------------------------------------------------

alter table public.courses enable row level security;

drop policy if exists "Allow anon select" on public.courses;
create policy "Allow anon select" on public.courses
  for select using (true);

drop policy if exists "Allow anon insert" on public.courses;
create policy "Allow anon insert" on public.courses
  for insert with check (true);

drop policy if exists "Allow anon update" on public.courses;
create policy "Allow anon update" on public.courses
  for update using (true) with check (true);

drop policy if exists "Allow anon delete" on public.courses;
create policy "Allow anon delete" on public.courses
  for delete using (true);
