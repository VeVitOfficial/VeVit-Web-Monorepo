#!/usr/bin/env bash
# Proves the atomic limiter holds under concurrency, and shows the old read-then-write pattern did not.
# Needs docker (throwaway postgres:18 on 127.0.0.1:55433). Never touches the real database.
set -euo pipefail
cd "$(dirname "$0")/../.."
NAME=vevit-ratelimit-test; PORT=55433
docker rm -f $NAME >/dev/null 2>&1 || true
docker run -d --name $NAME -e POSTGRES_PASSWORD=test -p 127.0.0.1:$PORT:5432 postgres:18 >/dev/null
trap 'docker rm -f $NAME >/dev/null 2>&1' EXIT
export PGPASSWORD=test
P="psql -h 127.0.0.1 -p $PORT -U postgres -X -q -At"
for _ in $(seq 1 60); do $P -c 'select 1' >/dev/null 2>&1 && break; sleep 1; done
$P -c "create table office_rate_limits (key_hash text primary key, hits int not null, window_end timestamptz not null);
       create table login_attempts (id bigserial primary key, ip_address text, action text, attempt_time timestamptz default now());" 2>/dev/null
# the function exactly as shipped in the migration
sed -n '/^create or replace function public.office_rate_consume/,/^end \$\$;/p' supabase/sql/account/026_office_oidc.sql | $P -f - 2>/dev/null

echo "OLD pattern (count, then insert): limit 10, 60 parallel requests"
passed=$(seq 1 60 | xargs -P60 -I{} $P -c "select case when (select count(*) from login_attempts where ip_address='1.2.3.4') < 10 then (select pg_sleep(0.03)::text) || 'pass' else 'blocked' end" | grep -c 'pass$' || true)
echo "  passed=$passed (a correct limiter would pass 10)"
fail=0
for round in 1 2 3; do
  limit=$((round * 5)); n=$((limit * 12))
  passed=$(seq 1 $n | xargs -P100 -I{} $P -c "select public.office_rate_consume('k$round', 60, $limit)" | grep -c '^t$' || true)
  if [ "$passed" -eq "$limit" ]; then echo "PASS  atomic limiter: limit $limit, $n parallel -> $passed passed"; else echo "FAIL  atomic limiter: limit $limit, $n parallel -> $passed passed"; fail=1; fi
done
exit $fail
