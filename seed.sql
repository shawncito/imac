-- ============================================================
-- Festival de Misiones 2026 — Seed para Supabase
-- Pega TODO esto en: Supabase → SQL Editor → Run
-- No contiene secretos. Re-ejecutable (idempotente).
-- ============================================================

-- 1. Tabla de configuración (key/value jsonb)
create table if not exists app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

-- 2. RLS: lectura pública, escritura con anon (MVP).
alter table app_config enable row level security;

drop policy if exists "public read"  on app_config;
drop policy if exists "anon write"    on app_config;
create policy "public read" on app_config for select using (true);
create policy "anon write"  on app_config for all    using (true) with check (true);

-- 3. Realtime: emitir cambios de app_config a los clientes suscritos.
alter publication supabase_realtime add table app_config;

-- 4. Datos de ejemplo (upsert → sobreescribe si ya existe).

-- 4a. Programa
insert into app_config (key, value, updated_at) values (
  'programa',
  '[
    {
      "day": "Viernes", "date": "26 de Junio", "short": "VIE", "isoDate": "2026-06-26",
      "events": [
        { "from": "6:30", "to": "8:00", "ampm": "pm", "title": "Inauguración Festival de Misiones 2026", "place": "Iglesia UNADECA", "featured": true }
      ]
    },
    {
      "day": "Sábado", "date": "27 de Junio", "short": "SÁB", "isoDate": "2026-06-27",
      "events": [
        { "from": "8:00",  "to": "9:15",  "ampm": "am", "title": "Inscripciones" },
        { "from": "9:00",  "to": "10:50", "ampm": "am", "title": "Programa de Escuela Sabática" },
        { "from": "11:00", "to": "12:00", "ampm": "md", "title": "Culto Divino", "place": "Iglesia UNADECA", "featured": true },
        { "from": "12:00", "to": "2:00",  "ampm": "pm", "title": "Almuerzo" },
        { "from": "2:00",  "to": "3:00",  "ampm": "pm", "title": "Seminario 1", "tag": "Seminarios" },
        { "from": "3:00",  "to": "4:00",  "ampm": "pm", "title": "Seminario 2", "tag": "Seminarios" },
        { "from": "4:15",  "to": "6:15",  "ampm": "pm", "title": "Programa de graduación", "featured": true },
        { "from": "6:30",  "to": "9:00",  "ampm": "pm", "title": "Social" }
      ]
    }
  ]'::jsonb,
  now()
)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 4b. Seminarios
insert into app_config (key, value, updated_at) values (
  'seminarios',
  '[
    { "icon": "hands", "title": "El poder del servicio", "room": "Salón multimedia",   "speaker": "Por confirmar", "description": "", "mapUrl": "" },
    { "icon": "globe", "title": "Misión transcultural",  "room": "Aula 1 AAA",          "speaker": "Por confirmar", "description": "", "mapUrl": "" },
    { "icon": "spark", "title": "Living the mission",    "room": "Salón de actos",      "speaker": "Por confirmar", "description": "", "mapUrl": "" },
    { "icon": "city",  "title": "Misión Urbana",         "room": "Salón Israel Leito",  "speaker": "Por confirmar", "description": "", "mapUrl": "" }
  ]'::jsonb,
  now()
)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 4c. Settings (hora demo apagada → usa hora real)
insert into app_config (key, value, updated_at) values (
  'settings', '{ "demoTime": null }'::jsonb, now()
)
on conflict (key) do update set value = excluded.value, updated_at = now();
