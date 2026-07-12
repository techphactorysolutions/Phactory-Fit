# PhactoryFit Privacy Notice

**Version:** 1.8.0  
**Operator:** Tech Phactory Solutions LLC

## Data stored on the device

PhactoryFit stores the following information in the browser's local storage:

- profile name and fitness targets;
- food diary entries and custom foods;
- weight, water, steps, sleep, workout minutes, and exercise calories;
- locally remembered barcode products;
- app preferences and a one-time voice-search disclosure acknowledgement.

The application has no PhactoryFit account server and does not automatically synchronize this information to Tech Phactory Solutions LLC.

## Information sent over the network

When a user searches for a packaged food or looks up an unknown barcode, the search text or barcode number is sent to Open Food Facts. The request also includes the PhactoryFit application name and version. Nutrition records and permitted product images are returned from Open Food Facts.

PhactoryFit does not include advertising SDKs, behavioral analytics, tracking pixels, or social-media SDKs.

## Camera and barcode photos

Live camera frames and barcode photos are processed in the browser for barcode recognition. PhactoryFit does not upload those images. The user must grant browser camera permission before live scanning. Closing the scanner stops the active camera tracks.

## Voice search

Voice recognition is provided by the browser and operating system rather than by a PhactoryFit server. On Safari, speech may be sent to Apple for online processing. PhactoryFit displays a disclosure and asks for confirmation before the first voice-search session.

## Storage isolation and GitHub Pages

Browser storage is scoped to a web origin. GitHub Pages project sites can share an origin when they use the same `username.github.io` host, even when their repository paths differ. Public deployments should use a dedicated custom domain or subdomain for PhactoryFit and should not serve unrelated, untrusted applications from that origin.

Local storage is not encrypted. A person who can access the unlocked device or browser profile may be able to view or delete it. Clearing Safari website data, uninstalling the Home Screen app in some circumstances, or resetting PhactoryFit can remove local records.

## User controls

Users can:

- export a JSON backup from Settings;
- import a previously exported PhactoryFit backup;
- reset all PhactoryFit data stored in the current browser;
- revoke camera permission in browser or device settings;
- avoid voice search and use typed search instead.

Exported backup files contain the user's fitness and nutrition data in readable JSON. Users should store them in a private location and avoid posting them publicly.

## Data minimization

PhactoryFit 1.8.0 does not collect email addresses, passwords, payment details, precise location, contacts, body photographs, government identifiers, or medical records. Features that add cloud storage, wearable health data, photos, or accounts require an updated privacy notice and security review before release.

## Health information

PhactoryFit provides general fitness and nutrition tracking. It is not a medical device and does not provide diagnosis, treatment, or emergency guidance. Users should verify community-supplied nutrition data against product packaging when accuracy matters.

## Restaurant location setting in 1.8.0

The optional two-letter state setting is stored locally with the rest of the profile. It is used only to label U.S. restaurant results. PhactoryFit does not request GPS access, transmit the state setting to a restaurant service, or determine a user's precise location. The bundled restaurant catalog is read locally from the app files.
