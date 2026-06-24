-- ============================================================
-- Festival de Misiones 2026 — Lockdown de moderación
-- Aplicar SOLO DESPUÉS de desplegar la Edge Function `submit-verse`
-- (con o sin el secret PERSPECTIVE_API_KEY — capa 2 es opcional).
--
-- Quita el acceso directo de anon a submit_verse: a partir de aquí,
-- la ÚNICA vía de envío es la Edge Function (service role), por lo que
-- la moderación de capa 2 (API) deja de ser bypasseable.
-- ============================================================

revoke execute on function submit_verse(text,text,text,text,text) from anon, authenticated;
-- service_role conserva execute por defecto (la Edge Function lo usa).
grant execute on function submit_verse(text,text,text,text,text) to service_role;
