-- ============================================================
-- Festival de Misiones 2026 — Renombrado de asociaciones/uniones
-- Pega TODO esto en: Supabase → SQL Editor → Run (idempotente)
--
-- Nueva lista oficial (5):
--   Asociación Norte de Costa Rica
--   Asociación Central Sur
--   Misión Caribe
--   Unión de Guatemala
--   UNADECA
--
-- Mapea los valores viejos de `region` a los nuevos y actualiza
-- el allowlist dentro de submit_verse().
-- ============================================================

-- ── 1. Migrar filas ya subidas ───────────────────────────────
-- 'Central' y 'Sur' se fusionan en 'Asociación Central Sur'.
update verse_submissions set region = 'Asociación Norte de Costa Rica' where region = 'Norte';
update verse_submissions set region = 'Asociación Central Sur'         where region in ('Central', 'Sur');
update verse_submissions set region = 'Misión Caribe'                  where region = 'Caribe';
update verse_submissions set region = 'Unión de Guatemala'             where region = 'Unión Guate';
update verse_submissions set region = 'Otro'                           where region = 'Otros';
-- 'UNADECA' se mantiene igual.

-- ── 2. Recrear submit_verse con el nuevo allowlist ───────────
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

  -- Caps de longitud
  if char_length(coalesce(p_reference,'')) > 60 or char_length(coalesce(p_text,'')) > 800 then
    raise exception 'TOO_LONG';
  end if;

  -- Region: solo valores de la lista del formulario (lista nueva)
  if p_region is not null and p_region not in
     ('Asociación Norte de Costa Rica','Asociación Central Sur','Misión Caribe','Unión de Guatemala','UNADECA') then
    raise exception 'REGION_INVALID';
  end if;

  -- Rate-limit por device
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
