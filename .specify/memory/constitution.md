<!--
Sync Impact Report
- Version change: 1.3.0 → 1.4.0 (MINOR: materially expanded constraints section)
- Modified principles: none
- Added principles: none
- Modified sections: Platform, Legal & Budget Constraints
  - Pricing: now also defers to the current provider's terms
  - Added "Current weather provider terms (Open-Meteo)": no ads or paid features;
    Open-Meteo (and GeoNames) attribution required; cache responses and stay under
    free-tier limits (600/min, 5,000/hour, 10,000/day)
- Removed sections: none
- Dependent templates: not modified (read the constitution at runtime)
- Follow-up TODOs:
  - specs/001-place-search-weather/plan.md: Constitution Check should cite v1.4.0 and the
    new provider-terms item (feature already complies: FR-009 attribution, FR-012 30-minute
    reuse, no ads)
-->

# Weather App Constitution

## Core Principles

Each principle carries one of three priority tiers:

- **Essential**: MUST be followed. Skipping it for any feature requires a constitution
  amendment first.
- **Recommended**: followed by default. A plan MAY skip it for a specific feature if its
  Constitution Check records the reason and the cost of skipping.
- **Optional for a project this size**: worth adopting if time allows, but it can be ignored
  without a written reason. No principle is currently in this tier.

### I. Privacy by Design (NON-NEGOTIABLE)

**Priority**: Essential

- The app MUST use only the phone's GPS location, and only to fetch forecasts.
- Location MUST NOT be stored on, or sent to, any server the project operates. The project runs
  no user accounts.
- Location sent to the weather data provider MUST be coarsened to roughly suburb level
  (about 1 km precision) before it leaves the device.
- The app MUST NOT include advertising, analytics, crash-reporting or other third-party code
  that collects location or a device identifier, unless a constitution amendment allows it.
- If the user declines location permission, the app MUST still work by letting them search
  for a place by name.
- The app MUST publish a plain-English privacy policy that follows the Australian Privacy
  Principles and names the weather data provider.

Rationale: this is a public app, and its reputation depends on trust. Collecting nothing is
cheaper and safer than protecting what was collected.

### II. Trustworthy When Things Go Wrong

**Priority**: Essential

- If the network or weather provider fails, the app MUST show the most recent saved forecast
  with a clear "last updated" time instead of crashing or showing an empty screen.
- Every forecast screen MUST show its data source and how old the data is.
- Error messages MUST be in plain English and tell the user what they can do next.
- The app MUST NOT show data it cannot vouch for, such as a forecast for the wrong place or
  one past its stated validity, without a visible warning.

Rationale: the main cost of failure is reputation. Being clear and honest about stale data
keeps trust and avoids one-star reviews.

### III. Accessible to Everyone

**Priority**: Essential

- Every screen MUST work with the built-in screen readers (VoiceOver on iPhone, TalkBack on
  Android). Every icon and graphic MUST have a spoken description.
- Text MUST resize with the phone's text-size setting, up to the largest standard size,
  without cutting off or overlapping.
- Colour contrast MUST meet WCAG 2.2 level AA (the widely used international accessibility
  standard): at least 4.5:1 for normal text.
- Information MUST NOT rely on colour alone. For example, rain chance needs a number, not
  just a shade of blue.
- Tap targets MUST be at least 44×44 points on iPhone and 48×48 dp on Android.
- The app MUST respect the phone's "reduce motion" and dark mode settings.

Rationale: a public app serves people with low vision, colour blindness and motor
difficulties. Accessibility also improves app store ratings and reach.

### IV. One Codebase, Two Platforms

**Priority**: Essential

- The app MUST ship on both iPhone and Android from one shared codebase built with a
  cross-platform framework (a toolkit that lets one set of code run on both). The planning
  phase chooses the framework.
- Platform-specific code MUST be kept to the minimum and isolated in clearly labelled places.
- The chosen framework MUST be widely used, actively maintained and backed by a major
  organisation.

Rationale: one part-time maintainer cannot keep two separate apps in step for years.

### V. Simple and Readable Over Clever

**Priority**: Essential

- Code MUST be simple enough for the project owner to read and understand before accepting
  it. This applies to AI-generated code in particular.
- Each change MUST be small and focused on one thing, so it can be reviewed in one sitting.
- New third-party libraries (ready-made code written by others) MUST be justified in writing.
  They MUST be actively maintained, widely used and have a compatible licence.
- Features MUST NOT be built for imagined future needs. Build what the current spec asks for.

Rationale: the app must last for years and is maintained by one person working with AI tools.
Code nobody understands cannot be safely changed.

### VI. Tested Before Shipped

**Priority**: Essential

- Core behaviour MUST have automated tests (small programs that check the app still works
  after a change). Core behaviour means fetching forecasts, caching them, coarsening location,
  handling failures and handling denied permission.
- All tests MUST pass before any release goes to the app stores.
- Every bug fix MUST include a test that would have caught the bug.
- Before each release, the app MUST be tried by hand on at least one real or simulated iPhone
  and one Android device, including a screen reader check.

Rationale: AI tools and humans both make mistakes that look right. Automated tests catch
them before users do.

### VII. Replaceable Weather Provider

**Priority**: Recommended

- All communication with the weather data provider SHOULD go through one small, clearly
  separated module. Other parts of the app SHOULD NOT talk to the provider directly.
- The rest of the app SHOULD use the project's own forecast data format, not the provider's.
- Replacing the provider SHOULD require changes to that module only.

Rationale: over a long lifespan, providers change prices, terms or shut down. Swapping one
module is cheap; untangling the whole app is not. It is Recommended rather than Essential
because the app still works for users if this slips; the cost only shows up at switch time.

### VIII. Low Running Cost by Default

**Priority**: Essential

- Total running costs MUST stay under AUD $20 per month. This includes app store fees spread
  across the year, weather data and any hosting.
- The app MUST work without a project-operated server. Adding one requires a constitution
  amendment.
- The app MUST cache forecasts on the device and reuse them for a set period before asking
  the provider again, so usage stays within free or low-cost data limits.
- Any new recurring cost MUST be written down with its expected monthly amount before it is
  adopted.

Rationale: the app is free to use and has no income, so costs must stay small and
predictable.

### IX. Security Basics

**Priority**: Essential

- **No secrets in code.** Passwords, signing keys and API keys (the codes that identify the app
  to a service such as the weather provider) MUST NOT be written into source code or committed
  to version control. They MUST be supplied through configuration kept outside the code, and
  that configuration MUST be excluded from version control.
- Anything shipped inside the app can be extracted by a determined person, so no truly secret
  value may ship in it. Any key the app needs MUST be the lowest-risk kind available:
  restricted to this app where the provider allows it, limited to read-only forecast access,
  and capped so misuse cannot exceed the budget in Principle VIII. A provider that needs no
  key is preferred.
- If a secret is ever exposed, it MUST be replaced with a new one immediately. Deleting it from
  the code is not enough, because version control keeps old copies.
- **Validate all user input.** Everything a user types or chooses, such as place searches and
  settings, MUST be checked before use: trimmed, limited in length, restricted to expected
  characters or values, and safely encoded before it is sent to the provider. Invalid input
  MUST produce a plain-English message, never a crash.

Rationale: leaked keys can run up bills or get the app blocked by its provider, and unchecked
input is the most common way apps crash or get abused. Both are cheap to prevent from day one
and expensive to fix after release.

### X. Explainability

**Priority**: Essential

- The agent (the AI coding tool producing the plan) MUST explain every non-obvious technical
  decision in plain language in that feature's `plan.md`.
- A decision is non-obvious if any of these apply:
  - a reasonable alternative existed;
  - it adds a library, tool, service or recurring cost;
  - it affects privacy, security, accessibility or the ability to change providers;
  - it would surprise someone with some coding experience.
- Each explanation MUST state what was chosen, why, which alternatives were rejected and why,
  and what the trade-off is (what is given up).
- Explanations MUST avoid unexplained jargon. Any technical term that remains MUST be
  explained in one sentence.
- A plan is incomplete, and MUST NOT proceed to tasks, until every non-obvious decision in it
  is explained.

Rationale: the owner approves plans but is not a professional software architect. They can
only judge, and later maintain, decisions they understand. Written reasons also record why
things are the way they are when the project is revisited years later.

## Platform, Legal & Budget Constraints

- **Market**: Australia at launch. Expanding to other countries MUST include a review of that
  country's privacy law (for example GDPR in the EU and UK) before release there.
- **Platforms**: iPhone (App Store) and Android (Google Play), released together.
- **Pricing**: free to download, with no ads or in-app purchases at launch. Adding a way to
  make money requires a constitution amendment if it conflicts with Principle I or VIII, or
  with the current weather provider's terms below.
- **Weather data**: the provider's licence MUST allow use in a free public app, and the app
  MUST show any attribution the licence requires (for example, Bureau of Meteorology terms).
- **Current weather provider terms (Open-Meteo)**: while Open-Meteo is the weather data
  provider, its free, non-commercial terms apply ("private or non-profit websites or apps
  that do not have subscriptions or advertising"). Therefore:
  - **No ads or paid features.** The app MUST NOT show advertising or offer subscriptions,
    in-app purchases or any other paid feature.
  - **Attribution.** Every screen that shows Open-Meteo weather data MUST display the
    attribution "Weather data by Open-Meteo.com". Place-search results that come from GeoNames
    via Open-Meteo MUST display "Place data: GeoNames". Both sources are licensed CC BY 4.0
    (a licence that allows reuse as long as the source is credited).
  - **Caching and free-tier limits.** Responses from Open-Meteo MUST be cached on the device
    and reused (Principle VIII). Each installed copy of the app MUST stay well under the
    free-tier limits of 600 calls per minute, 5,000 per hour and 10,000 per day. The app
    MUST NOT make calls in a loop or on a timer without a cache check.
  - Changing to another provider, or to Open-Meteo's paid tier, requires a constitution
    amendment that replaces this item with that provider's terms and records the new
    monthly cost (Principle VIII).
- **Alerts (reserved for the future)**: the app does not currently send severe-weather alerts
  or push notifications (messages that appear even when the app is closed). Adding them MUST
  be preceded by a constitution amendment. The amendment MUST set rules for delivery
  reliability, timeliness, official-source accuracy and testing, because alerts move the app
  from reputation risk toward safety risk.

## Development Workflow & Quality Gates

- Every feature MUST follow the Spec Kit flow: specify → plan → tasks → implement.
- Each plan MUST include a Constitution Check that confirms compliance with every Essential
  principle. It MUST also confirm compliance with every Recommended principle, or record
  why that principle is being skipped for this feature and what it will cost later.
- Each plan MUST include a plain-language explanation of every non-obvious technical decision,
  as required by Principle X.
- Version control (a system such as Git that records every change and allows undoing) MUST
  be used from the start. Each change MUST be committed with a clear message.
- Nothing is released unless:
  1. all automated tests pass;
  2. the accessibility checks in Principle III pass;
  3. no new data collection has been added without a privacy review under Principle I;
  4. the running-cost estimate still meets Principle VIII;
  5. a check confirms no secrets appear in the code or its version history (Principle IX).
- The owner MUST review AI-generated changes before accepting them and MUST reject any
  change they do not understand.

## Governance

- This constitution overrides all other project practices, specs and plans. When they
  conflict, the constitution wins until it is formally amended.
- The project owner approves amendments. Each amendment MUST record what changed, why, and
  any follow-up work needed to bring existing features into line.
- Versioning follows semantic versioning (a three-part number: MAJOR.MINOR.PATCH):
  - MAJOR: a principle is removed or redefined in an incompatible way, for example allowing
    location to be stored on a server;
  - MINOR: a principle or section is added or materially expanded, for example adding alerts;
  - PATCH: wording, clarification or typo fixes that do not change meaning.
- Compliance is checked at every plan's Constitution Check and before every release. The
  whole constitution MUST be re-read at least once a year, and after any major platform
  change from Apple or Google, to confirm it still fits.

**Version**: 1.4.0 | **Ratified**: 2026-09-24 | **Last Amended**: 2026-09-24
