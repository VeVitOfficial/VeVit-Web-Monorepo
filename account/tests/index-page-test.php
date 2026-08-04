<?php
declare(strict_types=1);

/**
 * Static contracts for the routed account settings shell.
 *
 * Run from the repository root:
 *   php tests/index-page-test.php
 */

$html = file_get_contents(__DIR__ . '/../index.html');
$css = file_get_contents(__DIR__ . '/../assets/styles.css');
$js = file_get_contents(__DIR__ . '/../assets/app.js');
if (!is_string($html) || !is_string($css) || !is_string($js)) {
  fwrite(STDERR, "Unable to load account page assets\n");
  exit(1);
}

$tests = 0;
$failures = [];

function index_page_test(string $name, callable $callback): void {
  global $tests, $failures;
  $tests++;
  try {
    $callback();
    fwrite(STDOUT, "PASS {$name}\n");
  } catch (Throwable $error) {
    $failures[] = "{$name}: {$error->getMessage()}";
    fwrite(STDERR, "FAIL {$name}: {$error->getMessage()}\n");
  }
}

function index_page_assert_contains(string $needle, string $haystack): void {
  if (!str_contains($haystack, $needle)) {
    throw new RuntimeException("missing {$needle}");
  }
}

function index_page_assert_not_contains(string $needle, string $haystack): void {
  if (str_contains($haystack, $needle)) {
    throw new RuntimeException("unexpected {$needle}");
  }
}

index_page_test('account page omits removed and demo-only data', function () use ($html): void {
  index_page_assert_not_contains('assets/config.js', $html);
  index_page_assert_not_contains('790 Kč', $html);
  index_page_assert_not_contains('4242', $html);
  index_page_assert_not_contains('24. 8. 2026', $html);
  index_page_assert_not_contains('QR kód<br>placeholder', $html);
  index_page_assert_not_contains('Spravováno přes Clerk', $html);
  index_page_assert_contains('href="/assets/styles.css?', $html);
  index_page_assert_contains('src="/assets/app.js?', $html);
});

index_page_test('desktop navigation exposes all canonical destinations', function () use ($html): void {
  index_page_assert_contains('class="settings-sidebar"', $html);
  index_page_assert_contains('aria-label="Nastavení účtu"', $html);
  foreach ([
    '/account',
    '/account/profile',
    '/account/security',
    '/account/billing',
    '/account/connections',
    '/account/notifications',
    '/account/preferences',
    '/account/privacy',
  ] as $path) {
    index_page_assert_contains('href="' . $path . '"', $html);
  }
  index_page_assert_not_contains('class="tabs"', $html);
});

index_page_test('mobile navigation and routed panels use the same section keys', function () use ($html): void {
  index_page_assert_contains('id="mobileSectionSelect"', $html);
  index_page_assert_contains('aria-label="Vybrat sekci nastavení"', $html);
  foreach ([
    'overview', 'profile', 'security', 'billing',
    'connections', 'notifications', 'preferences', 'privacy',
  ] as $section) {
    index_page_assert_contains('data-panel="' . $section . '"', $html);
  }
});

index_page_test('header identity has accessible menu and initials fallback', function () use ($html): void {
  index_page_assert_contains('id="userMenuButton"', $html);
  index_page_assert_contains('aria-haspopup="menu"', $html);
  index_page_assert_contains('aria-expanded="false"', $html);
  index_page_assert_contains('id="userMenu"', $html);
  index_page_assert_contains('role="menu"', $html);
  index_page_assert_contains('id="hdrInitials"', $html);
  index_page_assert_contains('id="hdrAvatar"', $html);
  index_page_assert_contains('id="signOutBtn"', $html);
});

index_page_test('overview has independent real-data state hosts', function () use ($html): void {
  foreach ([
    'overviewProfileState',
    'overviewSecurityState',
    'overviewSubscriptionState',
    'overviewActivityState',
  ] as $id) {
    index_page_assert_contains('id="' . $id . '"', $html);
  }
  index_page_assert_contains('data-state="loading"', $html);
  index_page_assert_contains('data-state="error"', $html);
  index_page_assert_contains('data-state="empty"', $html);
  index_page_assert_contains('data-retry=', $html);
});

index_page_test('profile form is labelled and starts safely disabled', function () use ($html): void {
  index_page_assert_contains('id="profileForm"', $html);
  foreach ([
    'profFullName', 'profNickname', 'profEmail', 'profBio',
    'profPhone', 'profLocation', 'profBirthDate',
  ] as $id) {
    index_page_assert_contains('for="' . $id . '"', $html);
    index_page_assert_contains('id="' . $id . '"', $html);
  }
  index_page_assert_contains('id="saveProfileBtn"', $html);
  index_page_assert_contains('id="nicknameError"', $html);
  index_page_assert_contains('aria-describedby="nicknameHint nicknameError"', $html);
});

index_page_test('page exposes toast and keyboard-safe dirty dialog', function () use ($html): void {
  index_page_assert_contains('id="accountToast"', $html);
  index_page_assert_contains('aria-live="polite"', $html);
  index_page_assert_contains('id="dirtyDialog"', $html);
  index_page_assert_contains('role="dialog"', $html);
  index_page_assert_contains('aria-modal="true"', $html);
  index_page_assert_contains('id="discardChangesBtn"', $html);
  index_page_assert_contains('id="keepEditingBtn"', $html);
});

index_page_test('styles provide sticky responsive accessible control center', function () use ($css): void {
  index_page_assert_contains('--shell-max: 1240px', $css);
  index_page_assert_contains('position: sticky', $css);
  index_page_assert_contains('.mobile-section-picker', $css);
  index_page_assert_contains('@media (max-width: 820px)', $css);
  index_page_assert_contains(':focus-visible', $css);
  index_page_assert_contains('.skeleton', $css);
  index_page_assert_contains('.state-card--error', $css);
  index_page_assert_contains('@media (prefers-reduced-motion: reduce)', $css);
});

index_page_test('client controller uses canonical history routing and local state', function () use ($js): void {
  index_page_assert_contains('const ROUTES =', $js);
  index_page_assert_contains("window.history.pushState", $js);
  index_page_assert_contains("window.history.replaceState", $js);
  index_page_assert_contains("window.addEventListener('popstate'", $js);
  index_page_assert_contains('window.__VV_ROUTE__', $js);
  index_page_assert_contains('const sectionCache = new Map()', $js);
  index_page_assert_contains("fetch('/api/' + path", $js);
  index_page_assert_contains("api('account-overview.php')", $js);
  index_page_assert_contains('data.errors?.security', $js);
  index_page_assert_contains('data.errors?.activity', $js);
  index_page_assert_contains('finally', $js);
  index_page_assert_contains('renderSectionError', $js);
  index_page_assert_contains('document.title =', $js);
});

index_page_test('client controller supports menu, profile dirty state, and retry', function () use ($js): void {
  index_page_assert_contains("event.key === 'Escape'", $js);
  index_page_assert_contains("userMenuButton.setAttribute('aria-expanded'", $js);
  index_page_assert_contains("window.addEventListener('beforeunload'", $js);
  index_page_assert_contains('profileOriginal', $js);
  index_page_assert_contains('profileDraft', $js);
  index_page_assert_contains('pendingNavigation', $js);
  index_page_assert_contains('restoreCurrentRouteControl();', $js);
  index_page_assert_contains('[data-retry]', $js);
});

if ($failures !== []) {
  fwrite(STDERR, "\n" . count($failures) . "/{$tests} tests failed\n");
  exit(1);
}

fwrite(STDOUT, "\n{$tests} tests passed\n");
