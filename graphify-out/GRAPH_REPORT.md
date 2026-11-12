# Graph Report - vevit-web-app  (2026-11-03)

## Corpus Check
- 475 files · ~285,026 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3711 nodes · 9351 edges · 168 communities (113 shown, 55 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 153 edges (avg confidence: 0.85)
- Token cost: 12,000 input · 11,000 output

## Community Hubs (Navigation)
- Tools UI components
- Edu legacy API
- Tools image components
- OIDC provider routes
- Store claims UI
- AI tools
- Text tools
- Store audit and availability
- Account 2FA captcha API
- Store catalog API
- Store claims API
- Account profile API
- Account security API
- Store claims list API
- Audio media tools
- Tools registry data
- Account dashboard pages
- AI gramotnost course content
- Edu pages
- Security certificate tools
- Tool runtime framework
- Account auth screens
- Office OIDC spec docs
- Login page and deps
- Account lifecycle API
- Edu content blocks
- Office crypto and reset form
- Edu course page
- Edu layouts and styles
- Edu navigation components
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 151
- Community 153
- Community 155
- Community 157

## God Nodes (most connected - your core abstractions)
1. `ToolComponentProps` - 107 edges
2. `Icon()` - 106 edges
3. `useToolUi()` - 101 edges
4. `toastSuccess()` - 97 edges
5. `accountSupabase()` - 77 edges
6. `loadScript()` - 75 edges
7. `fmtSize()` - 72 edges
8. `accountT()` - 57 edges
9. `handleAccountRequest()` - 51 edges
10. `quizJsonErr()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `verifierPair()` --calls--> `pkceChallenge()`  [EXTRACTED]
  tests/unit/office/helpers.mjs → src/lib/office/crypto.ts
- `makeDeps()` --calls--> `MockDns`  [EXTRACTED]
  tests/unit/office/helpers.mjs → src/lib/office/dns.ts
- `makeDeps()` --calls--> `loadOfficeKeys()`  [EXTRACTED]
  tests/unit/office/helpers.mjs → src/lib/office/jwt.ts
- `makeDeps()` --calls--> `MemoryStore`  [EXTRACTED]
  tests/unit/office/helpers.mjs → src/lib/office/memory-store.ts
- `Shared XSS regression gate` --conceptually_related_to--> `Store XSS regression fixture`  [INFERRED]
  docs/superpowers/plans/2026-08-05-vevit-sso-implementation.md → tests/store-xss-browser-fixture.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **XSS regression payload-corpus fixtures** — tests_xss_browser_fixture, tests_tools_markdown_browser_fixture, tests_store_xss_browser_fixture, docs_superpowers_plans_2026_08_05_vevit_sso_implementation_xss_regression_gate [INFERRED 0.85]
- **Office device enrollment (device flow, pairing, consent)** — docs_office_oidc_spec_device_flow, docs_office_oidc_spec_link_pairing_api, docs_office_oidc_spec_vevit_office_device_client, docs_office_oidc_spec_consent_screen [INFERRED 0.85]
- **Same-origin SSO architecture (session, auth layer, routing, Supabase base)** — docs_superpowers_plans_2026_08_05_vevit_sso_implementation_central_opaque_session, docs_superpowers_plans_2026_08_05_vevit_sso_implementation_shared_auth_layer, docs_superpowers_plans_2026_08_05_vevit_sso_implementation_path_routing, docs_superpowers_plans_2026_08_05_vevit_sso_implementation_supabase_lockdown [INFERRED 0.85]

## Communities (168 total, 55 thin omitted)

### Community 0 - "Tools UI components"
Cohesion: 0.03
Nodes (84): ToolUiI18n, loadScript(), useToolState(), HtmlToPdf(), JsPdfCtor, SIZES, A4, ImagesToPdf() (+76 more)

### Community 1 - "Edu legacy API"
Cohesion: 0.06
Nodes (82): dynamic, OPTIONS(), POST(), randomBytesHex(), runtime, dynamic, GET(), OPTIONS() (+74 more)

### Community 2 - "Tools image components"
Cohesion: 0.04
Nodes (72): ToolComponentProps, fmtSize(), ACCEPT, BgRemover(), matchesAccept(), Window, ACCEPT, BlobSize (+64 more)

### Community 3 - "OIDC provider routes"
Cohesion: 0.04
Nodes (63): dynamic, GET(), runtime, dynamic, GET(), POST(), runtime, dynamic (+55 more)

### Community 4 - "Store claims UI"
Cohesion: 0.05
Nodes (72): ClaimPage(), CLOSED, CreateState, DetailState, dynamic, EventRow, ItemRow, loadClaimCreate() (+64 more)

### Community 5 - "AI tools"
Cohesion: 0.06
Nodes (62): Icon(), useCopy(), AiCodeExplainer(), AiCommitMessage(), AiRegexGenerator(), aiRun(), pump(), ensureMarkdown() (+54 more)

### Community 6 - "Text tools"
Cohesion: 0.04
Nodes (62): copyText(), toastError(), AiEmailWriter(), AiHandle, AIToolApi, DEPS, LANGS, TONES (+54 more)

### Community 7 - "Store audit and availability"
Cohesion: 0.08
Nodes (66): auditActor(), AuditActorRow, auditRecord(), auditSanitize(), sanitizeValue(), ACTIVE_CLAIM_STATUSES, ACTIVE_RETURN_STATUSES, assertReservable() (+58 more)

### Community 8 - "Account 2FA captcha API"
Cohesion: 0.06
Nodes (67): GET(), dynamic, GET(), POST(), runtime, GET(), runtime, dynamic (+59 more)

### Community 9 - "Store catalog API"
Cohesion: 0.06
Nodes (51): GET(), GET(), GET(), CartPage(), update(), money, CatalogPage(), metadata (+43 more)

### Community 10 - "Store claims API"
Cohesion: 0.07
Nodes (65): DELETE, dynamic, GET, handler(), OPTIONS, PATCH, POST, PUT (+57 more)

### Community 11 - "Account profile API"
Cohesion: 0.05
Nodes (49): dynamic, GET(), runtime, dynamic, OAUTH_PROVIDERS, POST(), runtime, dynamic (+41 more)

### Community 12 - "Account security API"
Cohesion: 0.09
Nodes (52): RFC-4648, dynamic, POST(), runtime, dynamic, POST(), runtime, verify() (+44 more)

### Community 13 - "Store claims list API"
Cohesion: 0.05
Nodes (54): DELETE, dynamic, GET, OPTIONS, PATCH, POST, PUT, runtime (+46 more)

### Community 14 - "Audio media tools"
Cohesion: 0.14
Nodes (50): toastSuccess(), useToolUi(), ACCEPT, AudioConvert(), CODECS, Dropzone(), ensureMedia(), ensureWrapper() (+42 more)

### Community 15 - "Tools registry data"
Cohesion: 0.05
Nodes (48): AI, CALC, FFMPEG_TOOLS, HUB_CS, HUB_EN, LOCATION_META, RAW_TOOLS, RawLoc (+40 more)

### Community 16 - "Account dashboard pages"
Cohesion: 0.08
Nodes (35): Page(), Page(), Page(), Page(), Page(), Page(), AccountApiClient, AccountApiError (+27 more)

### Community 17 - "AI gramotnost course content"
Cohesion: 0.04
Nodes (11): dynamic, OPTIONS(), runtime, CHAPTERS, eduCourseLessonSlugs(), eduFindQuestion(), eduLesson(), LessonJson (+3 more)

### Community 18 - "Edu pages"
Cohesion: 0.08
Nodes (35): EduDashboardPageRoute(), EduSearchPageRoute(), PageProps, EduCoursePageRoute(), RouteProps, EduLessonPageRoute(), RouteProps, EduMyLessonPageRoute() (+27 more)

### Community 19 - "Security certificate tools"
Cohesion: 0.06
Nodes (47): RFC-6238, ProgressBar(), ResultCard(), CertificateInfo(), run(), dash(), LBL, SslBody (+39 more)

### Community 20 - "Tool runtime framework"
Cohesion: 0.05
Nodes (43): format(), Locale, TOOL_UI_I18N, DEFAULT_MAX, DropzoneOptions, emitToasts(), FilePickResult, ICON_PATHS (+35 more)

### Community 21 - "Account auth screens"
Cohesion: 0.09
Nodes (35): ForgotPasswordPage(), generateMetadata(), readLocale(), SUPPORTED, captchaToken(), loadTurnstileScript(), resetCaptcha(), turnstile() (+27 more)

### Community 22 - "Office OIDC spec docs"
Cohesion: 0.09
Nodes (8): Office provider decisions (DECISIONS.md), Vevit account as OIDC provider: contract with VeVit Office, VeVit Office provider README, Office provider operator TODO (TODO-VIT.md), VEVIT same-origin SSO implementation plan, Store XSS regression fixture, Tools markdown XSS fixture, Edu content sanitizer XSS regression fixture

### Community 23 - "Login page and deps"
Cohesion: 0.06
Nodes (19): generateMetadata(), LoginPage(), readLocale(), SUPPORTED, generateMetadata(), readLocale(), ResetPasswordPage(), SUPPORTED (+11 more)

### Community 24 - "Account lifecycle API"
Cohesion: 0.07
Nodes (36): dynamic, POST(), runtime, appOrigin(), dynamic, emailTemplate(), jsonErr(), POST() (+28 more)

### Community 25 - "Edu content blocks"
Cohesion: 0.08
Nodes (36): CodeBlock(), CodeBlockProps, calloutIcons, CustomBlock, CustomBlocks(), headingClasses, MatchBlock(), MultipleBlock() (+28 more)

### Community 26 - "Office crypto and reset form"
Cohesion: 0.13
Nodes (42): submit(), b64url(), humanCode(), ipFingerprint(), normalizeHumanCode(), openSecret(), pkceChallenge(), randomToken() (+34 more)

### Community 27 - "Edu course page"
Cohesion: 0.08
Nodes (41): ChapterSection(), ChapterSectionProps, diffColor(), EduCoursePage(), eduPath(), GamificationSection(), WhySection(), CircularProgress() (+33 more)

### Community 28 - "Edu layouts and styles"
Cohesion: 0.07
Nodes (27): cssVar(), HomePage(), metadata, readLocale(), SUPPORTED, viewport, metadata, readLocale() (+19 more)

### Community 29 - "Edu navigation components"
Cohesion: 0.09
Nodes (41): Attribution(), CustomLessonLike, Breadcrumb, BreadcrumbsContext, BreadcrumbsContextValue, BreadcrumbsProvider(), useEduBreadcrumbs(), BLOCK_TYPES (+33 more)

### Community 30 - "Community 30"
Cohesion: 0.10
Nodes (6): fail(), SupabaseOfficeStore, toConsent(), toDevice(), toDeviceCode(), toPending()

### Community 31 - "Community 31"
Cohesion: 0.08
Nodes (28): AccountLayout(), generateMetadata(), requestLocale(), SUPPORTED, ACCOUNT_ROUTES, accountRouteFromPathname(), AccountShell(), initialsFor() (+20 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (34): GET(), POST(), dynamic, POST(), runtime, dynamic, GET(), POST() (+26 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (27): Page(), ConfirmDialog(), RecoveryCodesModal(), TotpSetupModal(), ConnectionsPayload, OverviewPayload, promptPassword(), SecuritySection() (+19 more)

### Community 35 - "Community 35"
Cohesion: 0.13
Nodes (28): metadata, Page(), metadata, Page(), metadata, Page(), metadata, Page() (+20 more)

### Community 36 - "Community 36"
Cohesion: 0.12
Nodes (34): dynamic, GET(), OPTIONS(), phpFilterInt(), runtime, withChapterTag(), ChapterJson, eduChapterLessons() (+26 more)

### Community 37 - "Community 37"
Cohesion: 0.11
Nodes (32): Icon(), ICONS, CategoryCard(), CategoryDef, categoryIconMap, ContinueCard(), ContinueItem, CustomLessonsGrid() (+24 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (20): mailFromEnv(), MailMessage, MailSender, MailUnavailable, MockMail, ResendMail, UnconfiguredMail, confirm() (+12 more)

### Community 40 - "Community 40"
Cohesion: 0.07
Nodes (31): DELETE, dynamic, GET, OPTIONS, PATCH, POST, PUT, runtime (+23 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (30): ExerciseList(), LETTERS, Quiz(), QuizProps, QuizQuestion, resultMessage(), ChapterListCard(), ChapterListCardProps (+22 more)

### Community 42 - "Community 42"
Cohesion: 0.09
Nodes (27): RFC-6749, CLIENT_DEVICE, CLIENT_OFFICE, CODE_TTL_MS, DEVICE_CLIENTS, DEVICE_CODE_TTL_S, DEVICE_VERIFY_URL, ID_TOKEN_TTL_S (+19 more)

### Community 43 - "Community 43"
Cohesion: 0.10
Nodes (32): buildItem(), CHECKOUT_MAX_ITEMS, CHECKOUT_MAX_QUANTITY, CHECKOUT_MAX_TOTAL_MINOR, CHECKOUT_SNAPSHOT_TTL_SECONDS, CheckoutCreateInput, CheckoutCreateResult, CheckoutSnapshot (+24 more)

### Community 44 - "Community 44"
Cohesion: 0.11
Nodes (25): dynamic, GET(), runtime, dynamic, POST(), runtime, dynamic, POST() (+17 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (30): dynamic, GET(), handler(), OPTIONS(), POST(), runtime, safeJsonParse(), dynamic (+22 more)

### Community 46 - "Community 46"
Cohesion: 0.09
Nodes (24): Context, handler(), runtime, dynamic, GET(), Context, handler(), runtime (+16 more)

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (20): copyTree(), excludedSegments, generated, legacyDir, publicDir, publicExtensions, root, GET() (+12 more)

### Community 48 - "Community 48"
Cohesion: 0.15
Nodes (24): dynamic, OPTIONS(), runtime, dynamic, POST(), runtime, dynamic, POST() (+16 more)

### Community 49 - "Community 49"
Cohesion: 0.11
Nodes (27): CATEGORY_COUNTS, CATEGORY_ICON_PATH, CategorySection(), CategoryTileIcon(), DIM_STATUSES, HubApp(), PrivacyBand(), PROCESSING_BADGE_CLASS (+19 more)

### Community 50 - "Community 50"
Cohesion: 0.13
Nodes (24): CheckoutItem, phpAtom(), minorToDecimal(), atomToIso(), authorizeSnapshot(), consumeSnapshot(), CreateFromSnapshotResult, createOrderFromSnapshot() (+16 more)

### Community 51 - "Community 51"
Cohesion: 0.13
Nodes (25): dynamic, OPTIONS(), runtime, asDict(), dynamic, POST(), runtime, toInt() (+17 more)

### Community 52 - "Community 52"
Cohesion: 0.10
Nodes (19): ACHS_CS, ACHS_EN, CHAPTERS_CS, CHAPTERS_EN, COURSE_META_CS, COURSE_META_EN, dd(), GramData (+11 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (23): bearer(), consentRevoke(), consentsList(), deviceFromToken(), deviceRename(), devicesList(), deviceUnlink(), dnsAcme() (+15 more)

### Community 54 - "Community 54"
Cohesion: 0.18
Nodes (17): claimEvent(), normalizeError(), objectId(), priceFor(), PriceRow, processCheckout(), ProcessingError, processInvoice() (+9 more)

### Community 55 - "Community 55"
Cohesion: 0.17
Nodes (19): generateMetadata(), readLocale(), ToolsHubPage(), generateMetadata(), Props, readLocale(), STATUS_BADGE_CLASS, ToolPage() (+11 more)

### Community 56 - "Community 56"
Cohesion: 0.14
Nodes (20): bigToBits(), certField(), dateField(), derChildren(), DerNode, derOid(), derRead(), ip4ToLong() (+12 more)

### Community 57 - "Community 57"
Cohesion: 0.12
Nodes (21): ALLOWED_ACTIONS, ALLOWED_LANGUAGES, BASE_HEADERS, dynamic, FetchErr, FetchOk, GET(), phpIntCast() (+13 more)

### Community 58 - "Community 58"
Cohesion: 0.10
Nodes (6): active_session(), active_user(), blocked_user(), expired_session(), revoked_session(), sha256hex()

### Community 59 - "Community 59"
Cohesion: 0.13
Nodes (14): dynamic, POST(), runtime, dynamic, POST(), runtime, currentTokenHash(), dynamic (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.20
Nodes (17): AIBanner(), AIState, cssEscape(), EduSearchPage(), highlightQuote(), Phase, TOCBody(), AIAnswer (+9 more)

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (17): canTransitionPayment(), applyInventoryMovement(), createEntitlement(), dbBool(), fulfillmentConflict(), FulfillmentItem, LedgerRow, loadOrderItemsAndProducts() (+9 more)

### Community 62 - "Community 62"
Cohesion: 0.15
Nodes (15): DEFAULT_STATUS, dynamic, Icon(), ItemRow, loadSuccessOrder(), metadata, money(), Props (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.16
Nodes (16): Category, ProcessingLocation, Tool, ToolStatus, applyFilters(), CATEGORIES, DEFAULT_STATE, HubState (+8 more)

### Community 64 - "Community 64"
Cohesion: 0.12
Nodes (11): PdfDocCtor, pdfjs(), PdfjsDoc, PdfjsLib, PdfjsPage, PdfjsRenderTask, PdfjsViewport, PdfLib (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.13
Nodes (15): OPTIONS(), OPTIONS(), OPTIONS(), dynamic, OPTIONS(), runtime, OPTIONS(), OPTIONS() (+7 more)

### Community 67 - "Community 67"
Cohesion: 0.25
Nodes (11): AuditEvent, AuthCode, Consent, Device, DeviceCode, LinkRequest, OfficeUser, PendingAuth (+3 more)

### Community 68 - "Community 68"
Cohesion: 0.21
Nodes (16): CheckoutGrant, decodeCookieValue(), encodeCookie(), hasOrderGrant(), isExpired(), OrderGrant, pruneGrants(), readCheckoutGrant() (+8 more)

### Community 69 - "Community 69"
Cohesion: 0.15
Nodes (10): ChalltestDns, deps, dns, handle(), keys, mail, routes, server (+2 more)

### Community 70 - "Community 70"
Cohesion: 0.18
Nodes (14): Context, DELETE, dynamic, fail(), GET, handler(), ollamaModel(), ollamaUrl() (+6 more)

### Community 71 - "Community 71"
Cohesion: 0.24
Nodes (14): RecordRecent(), EMPTY, favoritesCache, getFavorites(), getRecents(), getServerSnapshot(), pushRecent(), readSlugs() (+6 more)

### Community 72 - "Community 72"
Cohesion: 0.20
Nodes (13): ALLOWED_ATTRIBUTES, ALLOWED_TAGS, collectElementDescendants(), detach(), DROP_TAGS, Element, elementById(), findAttribute() (+5 more)

### Community 73 - "Community 73"
Cohesion: 0.19
Nodes (9): Page(), initialsFor(), PROFILE_FIELDS, ProfileDraft, ProfileField, profileFromUser(), ProfileSection(), save() (+1 more)

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (12): useEduLang(), MoonIcon(), Navbar(), SunIcon(), applyTheme(), EduTheme, EduThemeContext, EduThemeContextValue (+4 more)

### Community 75 - "Community 75"
Cohesion: 0.20
Nodes (12): createSha256(), DELETE, dynamic, fail(), forwardToEdgeFunction(), GET, logSecurity(), PATCH (+4 more)

### Community 76 - "Community 76"
Cohesion: 0.21
Nodes (13): CITIES, COMPS, escCSV(), FakeDataGenerator(), FIELDS, FIRST, genValue(), LAST (+5 more)

### Community 77 - "Community 77"
Cohesion: 0.17
Nodes (12): DELETE, dynamic, GET, OPTIONS, PATCH, POST, PUT, runtime (+4 more)

### Community 78 - "Community 78"
Cohesion: 0.17
Nodes (12): DELETE, dynamic, GET, OPTIONS, PATCH, POST, PUT, runtime (+4 more)

### Community 79 - "Community 79"
Cohesion: 0.22
Nodes (11): DELETE, dynamic, fbFail(), GET, handler(), POST, PUT, runtime (+3 more)

### Community 80 - "Community 80"
Cohesion: 0.19
Nodes (12): COLORS, LBL, Mode, PasswordGen(), generate(), getStrength(), onCopy(), showStrength() (+4 more)

### Community 81 - "Community 81"
Cohesion: 0.18
Nodes (9): parseRanges(), pdfjs(), PdfjsDoc, PdfjsLib, PdfjsRenderTask, PdfjsViewport, PdfLib, PdfPageMod (+1 more)

### Community 82 - "Community 82"
Cohesion: 0.33
Nodes (11): asciiLower(), asPhpMap(), evaluateExercise(), phpArray(), phpListEquals(), PhpMap, phpRound(), phpSort() (+3 more)

### Community 83 - "Community 83"
Cohesion: 0.24
Nodes (7): dynamic, fail(), isSafeTargetUrl(), maxDuration, POST(), runtime, sslResolve()

### Community 84 - "Community 84"
Cohesion: 0.20
Nodes (10): DELETE, dynamic, FAILURE_MESSAGES, GET, handler(), POST, PUT, runtime (+2 more)

### Community 85 - "Community 85"
Cohesion: 0.25
Nodes (8): BirthNumberValidator(), pad(), Result, S, validate(), GradeAverageCalc(), Row, S

### Community 86 - "Community 86"
Cohesion: 0.27
Nodes (10): AiChat(), AiOpts, BotBubble(), BotIcon(), ensureMarkdown(), Msg, runAi(), TXT (+2 more)

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (10): b64ToBytes(), bytesToB64(), deriveKey(), EncryptDecrypt(), clearError(), run(), setModeFn(), showError() (+2 more)

### Community 88 - "Community 88"
Cohesion: 0.25
Nodes (10): CatKey, fmt(), fromC(), listFor(), S, TEMP, toC(), Unit (+2 more)

### Community 89 - "Community 89"
Cohesion: 0.25
Nodes (4): DnsAdapter, dnsFromEnv(), MockDns, UnconfiguredDns

### Community 90 - "Community 90"
Cohesion: 0.27
Nodes (9): isOidcProtocolPath(), config, HOST_REDIRECTS, legacyRewrite(), locales, preferredLocale(), proxy(), redirect() (+1 more)

### Community 91 - "Community 91"
Cohesion: 0.27
Nodes (9): dynamic, OPTIONS(), POST(), runtime, quizAwardVerifiedMilestone(), quizBadgeForVerifiedMilestone(), quizMilestoneLessonSlug(), quizValidateFinalReflection() (+1 more)

### Community 92 - "Community 92"
Cohesion: 0.36
Nodes (9): Acc, accToIban(), fmtAcc(), IbanConverter(), ibanToAcc(), mod97(), pad(), parseAcc() (+1 more)

### Community 93 - "Community 93"
Cohesion: 0.40
Nodes (9): generate(), LoremIpsum(), paragraph(), rint(), sentence(), START, Unit, word() (+1 more)

### Community 94 - "Community 94"
Cohesion: 0.36
Nodes (9): assign(), buildSvg(), COLORS, countLeaves(), layout(), maxDepthOf(), MindMap(), MmNode (+1 more)

### Community 95 - "Community 95"
Cohesion: 0.28
Nodes (7): ActivityRow, boundedText(), dynamic, GET(), normalizeActivity(), PROFILE_FIELDS, runtime

### Community 96 - "Community 96"
Cohesion: 0.22
Nodes (7): DELETE, GET, OPTIONS, PATCH, POST, PUT, runtime

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (8): compute(), Computed, FREQS, kc(), LoanCalc(), num(), RowData, S

### Community 98 - "Community 98"
Cohesion: 0.39
Nodes (8): CHILD, childBonus(), compute(), kc(), liveCompute(), NetSalaryCalc(), num(), S

### Community 100 - "Community 100"
Cohesion: 0.36
Nodes (8): compute(), kc(), Mode, num(), RATES, rateVal(), S, VatCalc()

### Community 101 - "Community 101"
Cohesion: 0.43
Nodes (7): displayName(), dynamic, GET(), handler(), htmlEscape(), runtime, strval()

### Community 102 - "Community 102"
Cohesion: 0.39
Nodes (7): allowedOrigins(), corsEchoHeaders(), dynamic, GET(), handler(), OPTIONS(), runtime

### Community 103 - "Community 103"
Cohesion: 0.29
Nodes (7): CATEGORY_COLORS, CATEGORY_ORDER, categoryLabel(), CATEGORY_DOT_LABEL, MODULE_SCRIPTS, Props, SiteHeader()

### Community 105 - "Community 105"
Cohesion: 0.50
Nodes (7): DateDiffCalc(), fmt(), liveCompute(), monthsBetween(), pad(), parse(), S

### Community 108 - "Community 108"
Cohesion: 0.39
Nodes (7): compute(), fmtT(), Mode, parseT(), S, TimeCalc(), val()

### Community 109 - "Community 109"
Cohesion: 0.29
Nodes (5): DELETE, GET, POST, PUT, runtime

### Community 110 - "Community 110"
Cohesion: 0.29
Nodes (5): DELETE, GET, POST, PUT, runtime

### Community 111 - "Community 111"
Cohesion: 0.43
Nodes (6): BmiCalc(), catOf(), compute(), LABELS, liveCompute(), LOCALE_TAG

### Community 112 - "Community 112"
Cohesion: 0.48
Nodes (6): CompoundInterestCalc(), compute(), FREQS, kc(), liveCompute(), S

### Community 113 - "Community 113"
Cohesion: 0.52
Nodes (6): compute(), DiscountCalc(), kc(), liveCompute(), num(), S

### Community 114 - "Community 114"
Cohesion: 0.43
Nodes (6): compute(), fmt(), Mode, num(), PercentageCalc(), S

### Community 115 - "Community 115"
Cohesion: 0.47
Nodes (4): generateMetadata(), readLocale(), RegisterPage(), SUPPORTED

### Community 116 - "Community 116"
Cohesion: 0.47
Nodes (5): disabledResponse(), dynamic, GET(), POST(), runtime

### Community 117 - "Community 117"
Cohesion: 0.53
Nodes (5): ACTS, BmrCalc(), kc(), liveCompute(), S

### Community 118 - "Community 118"
Cohesion: 0.60
Nodes (5): ContrastChecker(), lin(), lum(), parseColor(), toHex()

### Community 125 - "Community 125"
Cohesion: 0.70
Nodes (4): compute(), fmt(), FuelConsumptionCalc(), S

## Ambiguous Edges - Review These
- `Office provider decisions (DECISIONS.md)` → `VEVIT same-origin SSO implementation plan`  [AMBIGUOUS]
  docs/superpowers/plans/2026-08-05-vevit-sso-implementation.md · relation: references

## Knowledge Gaps
- **8 isolated node(s):** `RFC-6238`, `RFC-6238`, `RFC-4648`, `RFC-7636`, `RFC-8628` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1507 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OfficeStore` connect `Community 38` to `Community 42`, `Community 67`, `Community 34`, `Community 30`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `RFC-6238`, `RFC-4648` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Tools UI components` be split into smaller, more focused modules?**
  _Cohesion score 0.027555555555555555 - nodes in this community are weakly interconnected._
- **Why does `accountT()` connect `Community 33` to `Community 73`, `Account dashboard pages`, `Community 115`, `Account auth screens`, `Login page and deps`, `Community 31`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Edu legacy API` be split into smaller, more focused modules?**
  _Cohesion score 0.06349206349206349 - nodes in this community are weakly interconnected._
- **Why does `MemoryStore` connect `Community 34` to `Community 67`, `Community 69`, `Community 38`, `Community 39`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Office provider decisions (DECISIONS.md)` and `VEVIT same-origin SSO implementation plan`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._