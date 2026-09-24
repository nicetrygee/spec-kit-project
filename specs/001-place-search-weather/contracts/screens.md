# Contract: Screens (UI)

Two screens. The app swaps between them itself; there is no navigation library (plan.md D5).
Every interactive element is at least 48×48 (this covers both 44 pt on iPhone and 48 dp on
Android, FR-023). All text follows the phone's text-size setting (FR-021). Colours come from
one theme file with light and dark variants, each with a contrast ratio of at least 4.5:1 (FR-022, FR-024).
The screens have no animations, not even a loading spinner (loading shows the static text "Loading weather…"), so "reduce motion" is respected by default (FR-024).
Status messages are read out with `AccessibilityInfo.announceForAccessibility` only, never also a live region, so they aren't read twice.

## Search screen (app start)

| Element | Screen-reader label / role | Behaviour |
|---|---|---|
| Heading "Find a place" | role: header | — |
| Text box | label "Place name", hint "Type an Australian suburb or town" | Keyboard "search" key submits |
| "Search" button | role: button | Validates (FR-002), then searches |
| "Last viewed: Richmond, Victoria" | role: button, label "Last viewed: Richmond, Victoria. Opens its weather." | Only shown if a place was viewed before (FR-016) |
| Results list | each row role: button, label "Richmond, Victoria" | Tap → conditions screen |
| Message area | announced when it changes | Validation, no-results, offline and error messages |
| "Place data: GeoNames" | plain text | Always visible when results are shown |

### Messages (plain English, FR-002/FR-006/FR-015)

| Situation | Message |
|---|---|
| Empty or only spaces | "Type the name of a suburb or town to search." |
| Too short (1 character) | "Type at least 2 letters." |
| Too long (> 100) | "That's too long for a place name. Use 100 characters or fewer." |
| Bad characters | "Place names can only contain letters, spaces, hyphens, apostrophes, full stops and commas." |
| No matches | "No Australian places matched "<query>". Check the spelling or try a nearby town." |
| Search can't reach provider | "Search needs an internet connection. Check your connection and try again." plus, if a last viewed place exists, "You can still see saved weather for <place> above." |

## Conditions screen

| Element | Screen-reader label / role | Content |
|---|---|---|
| "Back to search" button | role: button | Returns to search. Android hardware back does the same. |
| Place heading | role: header | "Richmond, Victoria" (FR-008) |
| Description | text | "Overcast", or "Not available" |
| Temperature | label "Temperature 24 degrees" | "24°" (big) |
| Feels like | label "Feels like 22 degrees" | "Feels like 22°" |
| Rain chance | label "Chance of rain 0 percent" | "Rain: 0%" (a number, never colour alone, FR-022) |
| Wind | label "Wind 19 kilometres per hour from the north" | "Wind: 19 km/h N" |
| Freshness line | text | "Updated 5 minutes ago" (FR-010) |
| Source line | text | "Source: Open-Meteo · Weather data by Open-Meteo.com" (FR-009) |
| Couldn't-refresh note | announced | "Couldn't get newer weather. Showing saved weather from 2:15 pm." (FR-013) |
| Out-of-date warning | announced, with a ⚠ icon labelled "Warning" | "This weather may be out of date." (FR-014, or far from request) |
| Error state | announced + "Try again" button | "We couldn't get the weather for Richmond, Victoria. Check your internet connection and try again." (FR-015) |

Temperatures and wind are shown rounded to whole numbers, and screen-reader labels use the same
rounded numbers. Wind direction is spoken in words ("NNW" → "north-north-west").
The time in the couldn't-refresh note comes from the provider's timestamp (`observedAt`), the same
one the freshness line uses, so the two never disagree.
