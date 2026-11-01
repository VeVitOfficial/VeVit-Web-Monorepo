-- 028: Denní úklid office_purge_expired() přes pg_cron přímo v Supabase.
-- Proč pg_cron a ne Vercel Cron: úklid běží vedle dat, nepotřebuje veřejný HTTP endpoint ani sdílené tajemství (CRON_SECRET)
-- a nevypadne s limity funkcí. Rozšíření zapněte v Supabase: Database → Extensions → pg_cron; bez něj tato migrace jen vypíše upozornění
-- a po zapnutí ji stačí spustit znovu (je idempotentní).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('office-purge-expired', '17 3 * * *', 'select public.office_purge_expired()');
  else
    raise notice 'pg_cron is not enabled: office_purge_expired() is not scheduled yet (enable the extension and re-run 028)';
  end if;
end $$;
