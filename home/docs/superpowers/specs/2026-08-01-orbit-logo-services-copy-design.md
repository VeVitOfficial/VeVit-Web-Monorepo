# Orbit logo and Services copy design

## Scope

Replace the textual `Ve / CORE` mark inside the existing hero orbit with the supplied transparent `images/logo_text.png`. Preserve the orbit container, rings, animations, dimensions, and layout.

Move the changed Czech Services descriptions into the active `UI.translations.cs.landing.services` namespace and hydrate them through existing `data-ui-text` bindings. Present Services as a marketplace for real-world requests and offers, using a clear guild-board metaphor.

Account is explicitly excluded from implementation until its beta percentage and truthful feature description are approved.

## Visual treatment

The logo is rendered as a non-interactive decorative image inside the already `aria-hidden` orbit. It uses `object-fit: contain`, a maximum width and height smaller than the core circle, and a subtle filter only if browser verification shows the supplied emerald artwork needs separation from the dark radial background.

## Copy

- Navigation: `Poptávky a nabídky služeb`
- Card: `Tržiště služeb jako cechovní nástěnka: zadej quest nebo nabídni svůj skill — web, doučování, ilustraci i pomoc na zahradě.`
- Card metadata: `POPTÁVKY · NABÍDKY · QUESTY`
- Roadmap: `Tržiště poptávek a nabídek ve stylu cechovní nástěnky. Zadej quest nebo nabídni svůj skill — od webu a doučování po ilustraci či pomoc na zahradě.`

## Verification

Extend the PHP regression test before implementation. Then verify rendering at desktop size in Chromium, inspect contrast against the core background, and save a screenshot for user review before any later commit.
