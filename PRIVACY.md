# PhactoryFit Privacy Notice

**Version:** 1.13.0

PhactoryFit is local-first. Food diary entries, weight records, goals, habits, workouts, and saved foods remain in the browser unless the user exports a backup.

## Data that can leave the device

- Packaged-food search text or an unknown barcode may be sent to Open Food Facts.
- When Phactory Food Cloud is configured, the entered food/restaurant search text is sent to that endpoint to retrieve menu matches.
- The Food Cloud does not receive the diary, profile name, body weight, goals, steps, sleep, workouts, or precise location.
- Voice search is provided by the browser/platform and may use the platform vendor's speech service.

## Restaurant search

The local app recognizes 422 restaurant brands without transmitting a directory or GPS location. A canonical restaurant name may be added to the search text before sending the query to Food Cloud to improve provider accuracy. The optional state code is stored locally and is not included in Food Cloud requests.

## Camera and barcode data

Live camera frames and selected barcode photos are decoded locally. They are not uploaded by PhactoryFit. Only the decoded barcode number may be sent to a food database when no local match exists.

## Data storage and deletion

Browser storage is not end-to-end encrypted. Do not use PhactoryFit as a clinical medical-record system. Users can export a JSON backup, delete individual diary entries, or reset all local data in Settings.

## Not collected by this release

PhactoryFit does not collect email addresses, passwords, payment details, contacts, precise GPS location, body photographs, government identifiers, advertising identifiers, or medical records.
