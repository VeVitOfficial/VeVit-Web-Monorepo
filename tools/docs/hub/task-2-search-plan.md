# Task 2 — search implementation

Search reads only `assets/data/tools.json`, indexes a unique `Map` by slug and
never reads duplicated landing-page cards. It normalizes case and Czech
diacritics, ranks exact name, name prefix, aliases, keywords, slug and
description in that order, and applies bounded Levenshtein matching only to a
single token of at least four characters. URL state uses `q`, `category`,
`processing`, `status`, `new` and `sort`; invalid enum values are ignored.

The client creates result DOM nodes with `createElement` and `textContent`.
On dataset failure search is disabled while static category browsing remains.
