select cron.schedule(
  'vevit-session-cleanup',
  '17 3 * * *',
  $cleanup$
    delete from public.sessions
    where expires_at < now() - interval '30 days'
       or (revoked_at is not null and revoked_at < now() - interval '30 days');
    delete from public.api_refresh_tokens
    where expires_at < now() - interval '30 days'
       or (revoked_at is not null and revoked_at < now() - interval '30 days');
  $cleanup$
);
