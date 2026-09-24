# Feature Specification: Search a Place and See Its Current Weather

**Feature Branch**: `001-place-search-weather`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Search a place by name and see its current weather. The user types a place name (e.g. a suburb or town in Australia), picks the right match from a list of results, and sees the current conditions for that place: temperature, a short description of conditions, feels-like temperature, rain chance, and wind. The screen always shows the data source and how old the data is. If the network or provider fails, the app shows the most recently saved conditions for that place with a clear "last updated" time, or a plain-English message explaining what to do next if nothing is saved. This is the first, smallest increment of the weather app: no GPS/device location yet, no multi-day forecast, no saved favourites."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a place and see its current weather (Priority: P1)

A person wants to know what the weather is like right now in a particular Australian suburb or
town. They type its name, choose the correct match from a short list (for example, telling
"Richmond, VIC" apart from "Richmond, NSW"), and see the current conditions: temperature,
a short description (such as "Light rain"), feels-like temperature, chance of rain and wind.
The screen also says where the data came from and how old it is.

**Why this priority**: This is the core value of the app. Without it there is nothing to show.
It is also the path every user takes when they have not granted location access, which the
constitution requires to work.

**Independent Test**: With a working internet connection, search for "Richmond", pick
"Richmond, VIC", and confirm the current conditions, data source and data age appear.

**Acceptance Scenarios**:

1. **Given** the app is open and online, **When** the user types "Richmond" and submits,
   **Then** a list of matching Australian places appears, each showing enough detail (place
   name and state) to tell same-named places apart.
2. **Given** a list of search results, **When** the user picks one, **Then** the current
   conditions for that place appear, showing temperature, conditions description, feels-like
   temperature, chance of rain (as a percentage) and wind (speed and direction).
3. **Given** current conditions are shown, **When** the user looks at the screen, **Then** it
   shows the name of the data source, any attribution the source requires, and how old the
   data is (for example, "Updated 5 minutes ago").
4. **Given** current conditions are shown, **When** the user searches for and picks a
   different place, **Then** the screen shows that place's conditions and clearly names the
   new place.

---

### User Story 2 - See saved conditions when the connection fails (Priority: P2)

A person opens the app on a train with patchy reception, or while the weather provider is
having problems. Instead of an empty screen or a crash, they see the most recently saved
conditions for the place they last looked at, clearly marked with when it was last updated
and that it could not be refreshed.

**Why this priority**: The constitution requires the app to stay trustworthy when things go
wrong. It depends on User Story 1 having saved something first, so it comes second.

**Independent Test**: View a place's weather while online, turn on flight mode, reopen the app,
tap the "Last viewed" shortcut, and confirm the saved conditions appear with a "last updated" time and a plain-English note
that they could not be refreshed.

**Acceptance Scenarios**:

1. **Given** the user has viewed a place's weather before, **When** the app cannot reach the
   weather provider, **Then** it shows the most recently saved conditions for that place, the
   time they were last updated, and a plain-English note that newer data could not be fetched.
2. **Given** no conditions have ever been saved for the chosen place, **When** the app cannot
   reach the weather provider, **Then** it shows a plain-English message explaining the problem
   and what to do next (for example, "Check your internet connection and try again"), with a
   way to try again.
3. **Given** saved conditions are older than the staleness limit (see FR-014), **When** they
   are shown, **Then** a visible warning says they may be out of date.
4. **Given** the user has viewed a place within the reuse period (see FR-012), **When** they
   view it again, **Then** the saved conditions are shown without asking the provider again.
5. **Given** the user viewed "Richmond, VIC" in a previous session, **When** they reopen the
   app, **Then** the search screen shows a "Last viewed: Richmond, VIC" shortcut, and tapping
   it opens that place's conditions (fresh if online, saved if offline).

---

### User Story 3 - Helpful handling of unusual searches (Priority: P3)

A person mistypes a place name, types something that is not a place, or types nothing at all.
The app never crashes. It tells them in plain English what went wrong and what to try.

**Why this priority**: Required by the constitution's security and error-message principles,
but it refines Story 1 rather than adding new value.

**Independent Test**: Try an empty search, a single character, a 500-character string, a string
of symbols such as `<script>`, and a made-up name such as "Zzqxville". Confirm each produces a
plain-English message and the app keeps working.

**Acceptance Scenarios**:

1. **Given** the search box is empty or contains only spaces, **When** the user submits,
   **Then** the app asks them to type a place name and does not contact the provider.
2. **Given** the user types a name with no matches, **When** they submit, **Then** the app says
   no Australian places matched and suggests checking the spelling or trying a nearby town.
3. **Given** the user types text that is too long or contains characters that cannot appear in
   a place name, **When** they submit, **Then** the app explains what is allowed and does not
   contact the provider.

---

### Edge Cases

- The user has no internet connection when they try to search: the app explains that search
  needs a connection and, if a place was viewed before, offers its saved conditions.
- Many places share a name (e.g. "Springfield"): results list them all, up to a sensible limit,
  each with its state so the user can tell them apart.
- The provider returns conditions with some values missing (e.g. no rain chance): the missing
  item shows "Not available" rather than a blank, a zero or a crash.
- The provider returns data that is clearly for a different place, or already older than the
  staleness limit: the app shows a visible warning rather than presenting it as current.
- The device clock is wrong: data age is worked out from the provider's own observation time
  where available, and never shown as a negative age.
- The user switches the phone to dark mode, turns on "reduce motion", or sets the largest
  text size while the screen is open: the screen adapts without cutting off or overlapping text.
- The user types a place name with an apostrophe, hyphen or accent (e.g. "O'Connor",
  "Wagga Wagga", "Mount Isa"): these are accepted as valid.

## Requirements *(mandatory)*

### Functional Requirements

**Search**

- **FR-001**: Users MUST be able to search for a place by typing its name.
- **FR-002**: Search input MUST be checked before use: leading and trailing spaces removed,
  length between 2 and 100 characters, and only letters (including accented letters), spaces,
  hyphens, apostrophes, full stops and commas allowed. Invalid input MUST produce a
  plain-English message and MUST NOT be sent to any outside service.
- **FR-003**: Search results MUST be limited to places in Australia.
- **FR-004**: Each search result MUST show the place name and its state or territory, so
  that places with the same name can be told apart.
- **FR-005**: Search MUST show at most 10 results, most relevant first.
- **FR-006**: When no places match, the app MUST say so in plain English and suggest what to try.

**Current conditions**

- **FR-007**: After the user picks a place, the app MUST show its current conditions:
  temperature (°C), a short text description of conditions, feels-like temperature (°C),
  chance of rain (%), and wind speed (km/h) with direction.
- **FR-008**: The screen MUST show the place's name and state, so the user knows which place
  the conditions are for.
- **FR-009**: The screen MUST show the name of the data source and any attribution its licence
  requires.
- **FR-010**: The screen MUST show how old the data is, in plain words (e.g. "Updated 12
  minutes ago").
- **FR-011**: Any value the provider does not supply MUST be shown as "Not available".

**Saving and reuse**

- **FR-012**: The app MUST save the most recent conditions for each viewed place on the device,
  and MUST reuse them without contacting the provider if they are less than 30 minutes old.
- **FR-013**: If the provider cannot be reached or returns an error, the app MUST show the most
  recently saved conditions for the chosen place, with their "last updated" time and a
  plain-English note that newer data could not be fetched.
- **FR-014**: Conditions whose data is older than 3 hours (measured from the provider's own
  timestamp, whether just fetched or saved) MUST carry a visible warning that they may be out
  of date.
- **FR-015**: If nothing is saved for the chosen place and the provider cannot be reached, the
  app MUST show a plain-English message explaining the problem and what to do next, and offer
  a way to try again.
- **FR-016**: When the app is reopened, it MUST start on the search screen. If a place has been
  viewed before, the search screen MUST show a "Last viewed: [place, state]" shortcut that opens
  that place's conditions in one tap, following FR-012 to FR-015 (so it works offline with saved
  conditions). Only the single most recently viewed place is remembered; this is not a
  favourites list.

**Privacy and security**

- **FR-017**: Location details sent to the weather provider MUST be no more precise than
  about 1 km.
- **FR-018**: Searched place names and saved conditions MUST stay on the device and MUST NOT be
  sent anywhere other than the weather and place-search provider(s) needed to answer the request.
- **FR-019**: The feature MUST NOT include advertising, analytics or crash-reporting code.

**Accessibility**

- **FR-020**: Every element of the search and conditions screens, including icons and weather
  graphics, MUST be usable with VoiceOver and TalkBack, with a spoken description for every
  icon and graphic.
- **FR-021**: All text MUST resize with the phone's text-size setting, up to the largest
  standard size, without being cut off or overlapping.
- **FR-022**: Colour contrast MUST be at least 4.5:1 for normal text, and no information
  (such as rain chance) may rely on colour alone.
- **FR-023**: Tap targets MUST be at least 44×44 points on iPhone and 48×48 dp on Android.
- **FR-024**: The screens MUST follow the phone's dark mode and "reduce motion" settings.

### Key Entities

- **Place**: A named Australian location the user can choose. Has a name, a state or
  territory, and an approximate position (no more precise than about 1 km).
- **Current Conditions**: A snapshot of the weather at a place. Has temperature, feels-like
  temperature, conditions description, chance of rain, wind speed, wind direction, the time
  the provider observed or issued it, the data source name, and any required attribution.
  Belongs to one Place.
- **Saved Conditions**: The most recent Current Conditions for a Place, kept on the device,
  with the time they were saved. Used for reuse (FR-012) and fallback (FR-013).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can find the current weather for a named Australian suburb or
  town in under 30 seconds.
- **SC-002**: On a typical mobile connection, search results and current conditions each appear
  within 3 seconds in at least 95% of attempts.
- **SC-003**: 100% of screens showing conditions display the data source and data age.
- **SC-004**: With no connection, a previously viewed place's saved conditions appear within
  2 seconds of opening it, every time.
- **SC-005**: None of a set of at least 20 unusual inputs (empty, too long, symbols, emoji,
  made-up names) crashes the app; each produces a plain-English message.
- **SC-006**: A screen reader user can complete the search-and-view task on both iPhone and
  Android without sighted help.
- **SC-007**: Viewing the same place repeatedly within 30 minutes causes no more than one
  request to the weather provider.

## Assumptions

- **Scope**: This increment covers only search-by-name and current conditions. Device location
  (GPS), multi-day forecasts, hourly forecasts, saved favourites, alerts and settings are out
  of scope.
- **Market**: Australia only, as set by the constitution. Search results outside Australia are
  excluded.
- **Units**: Metric units (°C, km/h) with compass wind direction (e.g. "NW"), which is standard
  in Australia. No unit setting in this increment.
- **Rain chance**: "Chance of rain" means the provider's probability of rain for the current
  hour or nearest available period.
- **Reuse period and staleness limit**: 30 minutes (reuse) and 3 hours (warning) are sensible
  defaults for current conditions and keep provider usage within free limits. They can be
  tuned in planning if the chosen provider updates more or less often.
- **Provider**: A weather and place-search provider whose licence allows use in a free public
  app will be chosen during planning. It may be one or two services.
- **Place coordinates**: A searched place's position is the public centre point of that place,
  not the user's own position. It is still limited to about 1 km precision for consistency with
  the constitution.
- **Privacy policy**: The constitution's published privacy policy is a release requirement, not
  part of this increment. This increment must not collect anything that policy would need to
  disclose beyond the provider name.
