-- ============================================================
-- Festival de Misiones 2026 — Endurecimiento de seguridad
-- Pega TODO esto en: Supabase → SQL Editor → Run (idempotente)
--
-- Cierra: borrado/ocultado anónimo de la pizarra, UPDATE directo
-- de filas, escritura anónima de app_config y storage, like-spam,
-- y payloads gigantes en submit_verse.
--
-- Modelo admin: Supabase Auth (email+password). Un usuario admin
-- creado en Authentication → Users, con su uuid registrado en la
-- tabla `admins`. Las funciones admin validan is_admin() vía el JWT.
-- ============================================================

-- ── 0. Pre-requisitos ────────────────────────────────────────
create extension if not exists unaccent;

-- Normalizador del filtro (igual que el cliente: lower, sin acentos,
-- de-leet, solo letras, colapsa repeticiones). Re-declarado por idempotencia.
create or replace function normalize_for_filter(input text)
returns text language sql immutable as $$
  select regexp_replace(
    regexp_replace(
      translate(lower(unaccent(coalesce(input,''))), '401357$@', 'aoiestsa'),
      '[^a-z]', '', 'g'),
    '(.)\1+', '\1', 'g')
$$;

-- ── 1. Identidad admin ───────────────────────────────────────
-- Lista de uuids con permisos admin. Insertá manualmente el uuid del
-- usuario admin tras crearlo en Authentication → Users:
--   insert into admins(user_id) values ('<uuid-del-usuario>');
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table admins enable row level security;
-- Sin políticas para anon/authenticated: nadie la lee/escribe desde la API.
-- Solo funciones SECURITY DEFINER (corren como owner) la consultan.

-- True si el JWT actual pertenece a un admin registrado.
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
grant execute on function is_admin() to authenticated, anon;

-- ── 2. submit_verse endurecido (público / anon) ──────────────
-- Mantiene: rate-limit 5h por device, regex nombre, blocklist server.
-- Agrega: cap de longitud en texto/referencia, allowlist de region.
drop function if exists submit_verse(text, text, text, text);

create or replace function submit_verse(
  p_reference text, p_text text, p_name text, p_device text, p_region text default null
) returns verse_submissions
language plpgsql security definer set search_path = public as $$
declare
  v_row   verse_submissions;
  v_check text;
  b       text;
  v_block text[] := array[
    'puta','puto','puton','putona','mierda','mierd','verga','vergon',
    'pendejo','pendeja','cabron','cabrona','culero','culera','culo','culon','culona',
    'chinga','chingo','chingon','cono','joder','polla','marica','maricon',
    'zorra','zorras','perra','perras','pinche','caca','ojete','mamon','mamona',
    'huevon','huevona','hueva','guey','wey','webon','cojon','cojones',
    'idiota','imbecil','estupido','estupida','pedo',
    'fuck','fucker','fucking','shit','bitch','asshole','ass','dick','pussy',
    'cunt','whore','nigger','nigga','bastard','damn','crap'
  ];
begin
  -- Nombre: formato
  if char_length(trim(p_name)) < 2 or char_length(p_name) > 40 then
    raise exception 'NAME_FORMAT';
  end if;
  if p_name !~ '^[A-Za-zÀ-ÿ''. -]+$' then
    raise exception 'NAME_FORMAT';
  end if;

  -- Caps de longitud (un atacante puede llamar el RPC directo con payloads enormes)
  if char_length(coalesce(p_reference,'')) > 60 or char_length(coalesce(p_text,'')) > 800 then
    raise exception 'TOO_LONG';
  end if;

  -- Region: solo valores de la lista del formulario
  if p_region is not null and p_region not in
     ('Asociación Norte de Costa Rica','Asociación Central Sur','Misión Caribe','Unión de Guatemala','UNADECA','Otro') then
    raise exception 'REGION_INVALID';
  end if;

  -- Rate-limit por device (UX gate del cliente es espejo no vinculante)
  if exists (
    select 1 from verse_submissions
    where device_id = p_device and created_at > now() - interval '5 hours'
  ) then
    raise exception 'RATE_LIMIT';
  end if;

  -- Blocklist sobre nombre + referencia + texto
  v_check := normalize_for_filter(p_name || ' ' || p_reference || ' ' || p_text);
  foreach b in array v_block loop
    if v_check like '%'||b||'%' then
      raise exception 'PROFANITY';
    end if;
  end loop;

  insert into verse_submissions(verse_reference, verse_text, signer_name, device_id, region)
  values (p_reference, p_text, trim(p_name), p_device, p_region)
  returning * into v_row;
  return v_row;
end $$;
revoke all on function submit_verse(text,text,text,text,text) from public;
grant execute on function submit_verse(text,text,text,text,text) to anon, authenticated;

-- ── 3. Likes con dedupe por device (público / anon) ──────────
-- Un like por (versículo, device). Mata el like-spam por script y
-- mantiene el contador consistente con el Set local del cliente.
create table if not exists verse_likes (
  verse_id  uuid not null references verse_submissions(id) on delete cascade,
  device_id text not null,
  created_at timestamptz default now(),
  primary key (verse_id, device_id)
);
alter table verse_likes enable row level security;
-- Sin políticas: acceso solo vía las funciones SECURITY DEFINER de abajo.

drop function if exists like_verse(uuid);
drop function if exists unlike_verse(uuid);

create or replace function like_verse(p_id uuid, p_device text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into verse_likes(verse_id, device_id) values (p_id, p_device)
  on conflict do nothing;
  if found then
    update verse_submissions set likes = likes + 1 where id = p_id;
  end if;
end $$;
revoke all on function like_verse(uuid,text) from public;
grant execute on function like_verse(uuid,text) to anon, authenticated;

create or replace function unlike_verse(p_id uuid, p_device text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from verse_likes where verse_id = p_id and device_id = p_device;
  if found then
    update verse_submissions set likes = greatest(0, likes - 1) where id = p_id;
  end if;
end $$;
revoke all on function unlike_verse(uuid,text) from public;
grant execute on function unlike_verse(uuid,text) to anon, authenticated;

-- ── 4. Funciones admin: requieren is_admin() ─────────────────
create or replace function hide_verse(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;
  update verse_submissions set hidden = true where id = p_id;
end $$;

create or replace function unhide_verse(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;
  update verse_submissions set hidden = false where id = p_id;
end $$;

create or replace function delete_verse(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;
  delete from verse_submissions where id = p_id;
end $$;

-- anon ya no puede ejecutar las admin; solo usuarios autenticados (y is_admin filtra).
revoke all on function hide_verse(uuid)   from public;
revoke all on function unhide_verse(uuid) from public;
revoke all on function delete_verse(uuid) from public;
grant execute on function hide_verse(uuid)   to authenticated;
grant execute on function unhide_verse(uuid) to authenticated;
grant execute on function delete_verse(uuid) to authenticated;

-- ── 5. RLS de verse_submissions: cerrar escritura directa ────
alter table verse_submissions enable row level security;
-- Quitar la policy que permitía UPDATE directo a cualquiera.
drop policy if exists "admin hidden" on verse_submissions;
drop policy if exists "public insert" on verse_submissions;  -- inserts van por submit_verse
-- Lectura pública solo de lo no oculto.
drop policy if exists "public read" on verse_submissions;
create policy "public read" on verse_submissions for select using (hidden = false);
-- Revocar privilegios de tabla a anon (todo pasa por funciones SECURITY DEFINER).
revoke insert, update, delete on verse_submissions from anon;
revoke insert, update, delete on verse_submissions from authenticated;

-- ── 6. app_config: solo lectura pública; escritura por set_config admin ──
create or replace function set_config(p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;
  insert into app_config(key, value, updated_at)
  values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;
revoke all on function set_config(text,jsonb) from public;
grant execute on function set_config(text,jsonb) to authenticated;

alter table app_config enable row level security;
drop policy if exists "anon write"   on app_config;
drop policy if exists "service write" on app_config;
drop policy if exists "public read"  on app_config;
create policy "public read" on app_config for select using (true);
revoke insert, update, delete on app_config from anon;
revoke insert, update, delete on app_config from authenticated;

-- ── 7. Storage `imagenes`: lectura pública, escritura solo admin ──
drop policy if exists "anon_imagenes_all"        on storage.objects;
drop policy if exists "allow_anon_insert_imagenes" on storage.objects;
drop policy if exists "imagenes public read"     on storage.objects;
drop policy if exists "imagenes admin write"     on storage.objects;

create policy "imagenes public read" on storage.objects
  for select using (bucket_id = 'imagenes');

create policy "imagenes admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'imagenes' and is_admin())
  with check (bucket_id = 'imagenes' and is_admin());
