# Weather

A simple, free weather app for Australian places, built with Expo and React Native. Search
for a suburb or town, pick it from the list and see its current weather: temperature, feels
like, conditions, chance of rain and wind, with how old the reading is. The app keeps the
last result for each place on the phone. If there's no connection, it shows the saved
weather with a note, and it warns when data is over 3 hours old. There are no accounts, ads
or tracking. Coordinates are rounded to about 1 km before they leave the phone.

## Prerequisites

- Node 22 or later (`node -v`)
- The **Expo Go** app on an iPhone or Android phone, on the same Wi-Fi as your computer
  (or an iOS Simulator / Android emulator)
- No API keys or configuration: Open-Meteo needs no key

## Commands

```sh
npm install        # install dependencies
npm test           # run the automated tests
npm run typecheck  # check types
npx expo start     # start the app, then scan the QR code
```

On iPhone, scan the QR code with the Camera app. On Android, scan it from Expo Go. If the
phone can't connect over your network, try `npx expo start --tunnel`.

The manual checks, including the VoiceOver/TalkBack pass, are in
[specs/001-place-search-weather/quickstart.md](specs/001-place-search-weather/quickstart.md).

## Data attribution

- Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0), used under its
  non-commercial terms
- Place data: [GeoNames](https://www.geonames.org/) (CC BY 4.0), via Open-Meteo's geocoding API
