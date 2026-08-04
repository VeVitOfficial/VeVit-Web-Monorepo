#!/usr/bin/env bash
set -euo pipefail

: "${VEVIT_STORE_TEST_DSN:?VEVIT_STORE_TEST_DSN is required}"
: "${VEVIT_STORE_TEST_DB_USER:?VEVIT_STORE_TEST_DB_USER is required}"
: "${VEVIT_STORE_TEST_DB_PASS:?VEVIT_STORE_TEST_DB_PASS is required}"
if [[ "$VEVIT_STORE_TEST_DSN" != *test* ]]; then
  echo "REFUSE: HTTP tests require a test DSN" >&2
  exit 1
fi

server_name="vevit-agenda-http-$RANDOM-$$"
cookie_jar="$(mktemp)"
admin_jar="$(mktemp)"
headers="$(mktemp)"
body="$(mktemp)"
jpeg="$(mktemp --suffix=.jpg)"
cleanup() {
  docker rm -f "$server_name" >/dev/null 2>&1 || true
  rm -f "$cookie_jar" "$admin_jar" "$headers" "$body" "$jpeg"
}
trap cleanup EXIT

docker run --rm --network vevit-customer-agenda-net -v "$PWD:/app" -w /app \
  -e VEVIT_STORE_TEST_DSN="$VEVIT_STORE_TEST_DSN" -e VEVIT_STORE_TEST_DB_USER="$VEVIT_STORE_TEST_DB_USER" -e VEVIT_STORE_TEST_DB_PASS="$VEVIT_STORE_TEST_DB_PASS" \
  vevit-task04-php php tests/integration/customer-agenda-http-fixture.php >/dev/null

admin_hash="$(php -r "echo password_hash('http-test-admin', PASSWORD_DEFAULT);")"
docker run -d --name "$server_name" --network vevit-customer-agenda-net -p 127.0.0.1::8080 \
  -v "$PWD:/app" -v "$PWD/tests/fixtures/empty-config-secret.php:/app/config_secret.php:ro" -w /app \
  -e APP_ENV=test -e APP_URL=http://127.0.0.1 -e APP_STORAGE_PATH=/tmp/vevit-http-storage \
  -e DB_DSN="$VEVIT_STORE_TEST_DSN" \
  -e DB_USER="$VEVIT_STORE_TEST_DB_USER" -e DB_PASS="$VEVIT_STORE_TEST_DB_PASS" \
  -e SESSION_COOKIE_SECURE=false -e SESSION_NAME=vevit_http_test \
  -e 'TRACKING_CARRIER_ORIGINS_JSON={"ppl":"https://www.ppl.cz"}' \
  -e ADMIN_PASSWORD_HASH="$admin_hash" vevit-task04-php sh -lc 'mkdir -p -m 700 /tmp/vevit-http-storage; php -S 0.0.0.0:8080 router.php' >/dev/null
port="$(docker port "$server_name" 8080/tcp | sed 's/.*://')"
base="http://127.0.0.1:$port"
ready=false
for _ in $(seq 1 30); do
  if curl -fsS "$base/orders.php" >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 0.2
done
if [[ "$ready" != true ]]; then
  echo "HTTP test server did not become ready" >&2
  docker logs "$server_name" 2>&1 | tail -30 >&2
  exit 1
fi

# Create an exact guest-grant server session without adding a production backdoor.
session_id="httpguest$(printf '%024d' "$RANDOM")"
customer_csrf="$(printf '1%.0s' {1..64})"
docker exec "$server_name" php -r 'session_name("vevit_http_test");session_id($argv[1]);session_start();$_SESSION["_store_session_initialized"]=time();$_SESSION["_store_order_grants"][str_repeat("a",32)]=["grant"=>"guest-http-grant"];$_SESSION["_store_csrf"]["customer_agenda"]=$argv[2];session_write_close();' "$session_id" "$customer_csrf"
printf "# Netscape HTTP Cookie File\n127.0.0.1\tFALSE\t/\tFALSE\t0\tvevit_http_test\t%s\n" "$session_id" >"$cookie_jar"
docker exec "$server_name" sh -lc 'mkdir -p -m 700 /tmp/vevit-http-storage/case-attachments/aa/bb'
docker exec "$server_name" php -r 'file_put_contents("/tmp/vevit-http-storage/case-attachments/aa/bb/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg", "\xFF\xD8\xFF\xE0".str_repeat("A",32));chmod("/tmp/vevit-http-storage/case-attachments/aa/bb/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg",0600);'

pages=(
  "orders.php" "order.php?id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" "claims.php"
  "claim.php?id=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" "my-returns.php"
  "return.php?id=cccccccccccccccccccccccccccccccc" "favorites.php"
)
for page in "${pages[@]}"; do
  curl -sS -b "$cookie_jar" -D "$headers" -o "$body" "$base/$page"
  grep -qi '^Content-Type: text/html' "$headers"
  ! grep -q '<?php' "$body"
  ! grep -Eqi 'TOP SECRET|storage_key|/tmp/vevit-http-storage|guest-http-grant' "$body"
done

curl -sS -b "$cookie_jar" "$base/api/claims/detail.php?id=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" -o "$body"
! grep -Eqi 'internal_note|TOP SECRET|storage_key' "$body"
grep -q 'Test product' "$body"
curl -sS -b "$cookie_jar" "$base/api/returns/detail.php?id=cccccccccccccccccccccccccccccccc" -o "$body"
! grep -Eqi 'internal_note|TOP SECRET|storage_key' "$body"
grep -q 'Test product' "$body"
curl -sS -b "$cookie_jar" -o /dev/null -w '%{http_code}' "$base/api/claims/list.php" | grep -qx '401'
curl -sS -b "$cookie_jar" -o /dev/null -w '%{http_code}' "$base/api/returns/list.php" | grep -qx '401'
curl -sS -o /dev/null -w '%{http_code}' -X POST "$base/api/attachments/upload.php" | grep -qx '403'
curl -sS -o /dev/null -w '%{http_code}' -X POST "$base/case-attachment.php" | grep -qx '403'
curl -sS -b "$cookie_jar" -D "$headers" -o "$body" -X POST \
  --data-urlencode "csrf=$customer_csrf" --data-urlencode 'attachment_id=a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1' \
  "$base/case-attachment.php"
grep -qi '^X-Content-Type-Options: nosniff' "$headers"
grep -qi '^Content-Disposition: attachment;' "$headers"
test "$(wc -c <"$body")" -eq 36

printf '\xFF\xD8\xFF\xE0%s' 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' >"$jpeg"
curl -sS -b "$cookie_jar" -o "$body" -w '%{http_code}' -X POST \
  -H "X-CSRF-Token: $customer_csrf" -H 'Idempotency-Key: http-upload-dangerous-name' \
  -F 'case_type=claim' -F 'case_id=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' -F "attachment=@$jpeg;type=image/jpeg;filename=proof.php.jpg" \
  "$base/api/attachments/upload.php" | grep -qx '422'
curl -sS -b "$cookie_jar" -o "$body" -w '%{http_code}' -X POST \
  -H "X-CSRF-Token: $customer_csrf" -H 'Idempotency-Key: http-upload-1' \
  -F 'case_type=claim' -F 'case_id=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' -F "attachment=@$jpeg;type=image/jpeg;filename=proof.jpg" \
  "$base/api/attachments/upload.php" | grep -qx '201'
grep -q '"attachment"' "$body"

public_session="httppublic$(printf '%023d' "$RANDOM")"
public_jar="$(mktemp)"
docker exec "$server_name" php -r 'session_name("vevit_http_test");session_id($argv[1]);session_start();$_SESSION["_store_session_initialized"]=time();$_SESSION["_store_csrf"]["customer_agenda"]=$argv[2];session_write_close();' "$public_session" "$customer_csrf"
printf "# Netscape HTTP Cookie File\n127.0.0.1\tFALSE\t/\tFALSE\t0\tvevit_http_test\t%s\n" "$public_session" >"$public_jar"
curl -sS -b "$public_jar" -o /dev/null -w '%{http_code}' -X POST \
  --data-urlencode "csrf=$customer_csrf" --data-urlencode 'attachment_id=a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1' \
  "$base/case-attachment.php" | grep -qx '404'
rm -f "$public_jar"

curl -sS -c "$admin_jar" "$base/admin/auth.php" -o "$body"
login_csrf="$(sed -n 's/.*name="csrf" value="\([^"]*\)".*/\1/p' "$body" | head -1)"
test -n "$login_csrf"
curl -sS -b "$admin_jar" -c "$admin_jar" -o /dev/null -X POST --data-urlencode "csrf=$login_csrf" --data-urlencode 'password=http-test-admin' "$base/admin/auth.php"
for page in claims returns deliveries; do
  curl -sS -b "$admin_jar" -D "$headers" -o "$body" "$base/admin/$page.php"
  grep -qi '^Content-Type: text/html' "$headers"
  grep -q 'dočasný sdílený účet' "$body"
  ! grep -q '<?php' "$body"
done
curl -sS -b "$admin_jar" "$base/admin/deliveries.php" -o "$body"
grep -q 'admin-delivery-create' "$body"
for detail in \
  'claims.php?id=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' \
  'returns.php?id=cccccccccccccccccccccccccccccccc' \
  'deliveries.php?id=dddddddddddddddddddddddddddddddd'; do
  curl -sS -b "$admin_jar" -o "$body" "$base/admin/$detail"
  grep -q 'Test product' "$body"
  ! grep -Eqi 'storage_key|/tmp/vevit-http-storage|guest-http-grant' "$body"
done
curl -sS -b "$admin_jar" "$base/admin/claims.php?id=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" -o "$body"
grep -q 'data-item-quantity' "$body"
grep -q 'resolution_outcome' "$body"
curl -sS -b "$admin_jar" "$base/admin/returns.php?id=cccccccccccccccccccccccccccccccc" -o "$body"
grep -q 'data-item-quantity' "$body"
grep -q 'received_at' "$body"
curl -sS -b "$admin_jar" -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' --data '{}' "$base/api/admin/claims.php" | grep -qx '403'
curl -sS -b "$admin_jar" "$base/admin/claims.php" -o "$body"
admin_csrf="$(grep -oE '"X-CSRF-Token":"[a-f0-9]{64}"' "$body" | head -1 | cut -d'"' -f4)"
test -n "$admin_csrf"
delivery_create_status="$(curl -sS -b "$admin_jar" -o "$body" -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $admin_csrf" -H 'Idempotency-Key: http-admin-delivery-create-1' \
  --data '{"order_id":1,"data":{"carrier_code":"ppl","tracking_number":"TRACK-2","tracking_url":"https://www.ppl.cz/track/2","items":[{"order_item_id":1,"quantity":1}]}}' \
  "$base/api/admin/delivery-create.php")"
if [[ "$delivery_create_status" != "201" ]]; then
  echo "delivery create HTTP status: $delivery_create_status" >&2
  sed -n '1,20p' "$body" >&2
  docker logs "$server_name" 2>&1 | tail -20 >&2
  exit 1
fi
grep -q '"delivery"' "$body"
curl -sS -b "$admin_jar" -o "$body" -X POST \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $admin_csrf" -H 'Idempotency-Key: http-admin-claim-1' \
  --data '{"id":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","expected_version":1,"target_status":"under_review","data":{"public_message":"Kontrola zahájena"}}' \
  "$base/api/admin/claims.php"
grep -q '"status":"under_review"' "$body"
actor_count="$(docker exec vevit-customer-agenda-postgres psql -U vevit -d vevit_store_test -Atc "SELECT count(*) FROM store_audit_events WHERE actor_type='legacy_shared_admin' AND actor_session_id IS NOT NULL")"
test "$actor_count" -ge 1

logout_csrf="$(sed -n 's/.*name="csrf" value="\([^"]*\)".*/\1/p' "$body" | tail -1)"
# Fetch a page because the mutation response is JSON and intentionally contains no CSRF.
curl -sS -b "$admin_jar" "$base/admin/claims.php" -o "$body"
logout_csrf="$(sed -n 's/.*name="csrf" value="\([^"]*\)".*/\1/p' "$body" | tail -1)"
test -n "$logout_csrf"
curl -sS -b "$admin_jar" -o /dev/null -X POST --data-urlencode "csrf=$logout_csrf" "$base/admin/logout.php"
curl -sS -b "$admin_jar" -o /dev/null -w '%{http_code}' "$base/admin/claims.php" | grep -qx '302'

rate_jar="$(mktemp)"
curl -sS -c "$rate_jar" "$base/admin/auth.php" -o "$body"
rate_csrf="$(sed -n 's/.*name="csrf" value="\([^"]*\)".*/\1/p' "$body" | head -1)"
for _ in $(seq 1 8); do
  curl -sS -b "$rate_jar" -c "$rate_jar" -o /dev/null -X POST --data-urlencode "csrf=$rate_csrf" --data-urlencode 'password=wrong-password' "$base/admin/auth.php"
done
curl -sS -b "$rate_jar" -o /dev/null -w '%{http_code}' -X POST --data-urlencode "csrf=$rate_csrf" --data-urlencode 'password=wrong-password' "$base/admin/auth.php" | grep -qx '429'
rm -f "$rate_jar"

echo "PASS: customer-agenda-http"
