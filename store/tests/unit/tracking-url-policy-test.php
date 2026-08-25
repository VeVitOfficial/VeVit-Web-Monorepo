<?php
declare(strict_types=1);
require_once __DIR__.'/../testlib.php';require_once __DIR__.'/../../lib/delivery/TrackingUrlPolicy.php';
$p=new TrackingUrlPolicy(['ppl'=>'https://www.ppl.cz']);
test_assert_same(true,$p->isSafe('ppl','https://www.ppl.cz/vyhledat-zasilku?shipmentId=1'),'known carrier https URL accepted');
test_assert_same(false,$p->isSafe('ppl','javascript:alert(1)'),'script URL rejected');
test_assert_same(false,$p->isSafe('ppl','https://evil.test/x'),'foreign host rejected');
test_assert_same(false,$p->isSafe('ppl','https://www.ppl.cz:8443/x'),'nonstandard carrier port rejected');
test_assert_same(false,$p->isSafe('ppl','https://user:pass@www.ppl.cz/x'),'userinfo in tracking URL rejected');
test_complete('tracking-url-policy-test');
