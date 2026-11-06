---
title: "Hybrid WordPress + React Intranet — Technical Requirements"
role: "Sole developer: React front end, WordPress theme and back end"
stack: ["WordPress", "PHP", "React", "Redux Toolkit", "React Router", "Tailwind CSS", "Headless UI", "webpack", "ACF Pro", "REST API"]
status: published
---

# Technical Requirements

How the intranet was put together: a WordPress theme that runs the server-side checks, a custom REST API, and a React single-page app that renders everything the user sees.

## Architecture

### Platform

A single WordPress install on managed WordPress hosting serves both the content and the application. The host did not support running WordPress headless, so the React app is bundled with webpack into the theme and mounted by the theme's page template.

### Server-side checks

The page template runs before React mounts:

1. Logged-out visitors are redirected to the login page.
2. Users who have not completed onboarding are redirected to the onboarding flow.
3. Pages the user's role may not see are blocked.

Only then does the template output the React root. It bootstraps the current user, ACF options, a REST nonce and the user's restriction map into the page through WordPress script localisation (wp_localize_script).

### React application

React 18 with Redux Toolkit (about 20 slices) for shared state, React Router 6 for client-side routing, and Tailwind CSS with Headless UI for the interface. PostCSS runs in the webpack build, and Sentry reports front-end errors.

### REST API

A custom REST namespace exposes around 26 endpoints. Every route rejects logged-out requests, and cross-origin requests are limited to the site's own origin.

| Endpoint group | Used for |
| --- | --- |
| Search | Site-wide search, filtered by the user's role |
| News and events | Company news, events and the dashboard feed |
| Users and directory | Profiles, directory listings, managers and direct reports |
| Map members | Generalised locations for the employee map |
| Birthdays and anniversaries | Celebration blocks on the dashboard |
| Training progress | Onboarding steps and completion |
| Notifications | Unseen and seen lists, mark as read |
| Teams | Department and team spaces |
| Resources | Documents and links by category |
| Room calendars and booking | Room events and an availability check before booking |
| Peer messages and announcements | Kudos and the announcement feed |

### Integrations

- **Okta single sign-on** through SAML, with SCIM user provisioning, both via plugins, plus a separate fallback login page.
- **Google Calendar** through a service account: each meeting room has its own calendar, which is read for availability.
- **Gravity Forms** for booking requests: a submission creates the calendar event and invites the attendees.
- **BuddyPress** for peer messages (kudos).
- **WP All Import** for bulk user data.
- **Sentry** for front-end error monitoring.

## Requirements

| Area | Requirement | Implementation |
| --- | --- | --- |
| Access | Only signed-in staff can see any page or data | The page template redirects logged-out visitors before the app mounts; every custom REST route rejects logged-out requests; cross-origin requests are limited to the site origin |
| Onboarding | New users finish onboarding before using the intranet | A server-side redirect to the onboarding flow until the user's completion flag is set; the steps are training posts written by administrators |
| Roles | Areas are restricted by role | Administrator-configured role lists per area (support, resources, directory, teams, training, office hub); blocked pages are refused on the server; search results are filtered by per-post role restrictions |
| Notifications | Targeted announcements with read state | Per-user unseen and seen lists, filled on save for the chosen teams and named users; news posts can notify everyone |
| Recognition | Peer kudos | Preset messages sent to a colleague as BuddyPress messages and shown in a feed with company announcements |
| Location | A staff map without exact addresses | City and state geocoded on the server when a profile is updated; markers offset on the client; the map loads when scrolled into view |
| Booking | Room booking against live calendars | Each room's Google Calendar is read through a service account; an availability check runs before booking; a Gravity Forms submission creates the event with invitees |
| Identity | Single sign-on and provisioning | Okta via SAML and SCIM through plugins, with a fallback login page |
| Monitoring | Front-end errors are visible | Sentry in the React bundle |

## Data model

### Custom post types

Training (the onboarding steps), training documents, events, badges, open positions, resources, support documents, rooms, notifications, and teams and departments. ACF Pro defines their fields and the site-wide options.

### Users and relationships

Each user profile holds the job title, team, manager, city and state, and the geocoded coordinates. Direct reports are derived from the manager field. Bulk user data was loaded with WP All Import.

### Notifications

Each user has two ACF relationship lists: unseen and seen. When an administrator saves a notification, it is added to the unseen list of every member of the chosen teams and of every named user. Marking it as read moves it to the seen list. News posts have a notify-everyone flag that targets every user.

> [!info]
> The demos in this portfolio rebuild these behaviours with fictional people, teams and messages. No data, credentials or branding from the real intranet is used.

## Security and access

- Every page and every REST route requires a signed-in user, and REST requests carry a nonce.
- Role-specific gating is configured by administrators per area and enforced on the server, both for pages and for search results.
- Single sign-on and SCIM provisioning keep accounts in step with the company's identity provider.
- The employee map never shows an exact location: coordinates come from city and state only, and markers are offset.

## Performance and accessibility

### Performance

- After the first page load, navigation happens in the browser without full page loads.
- The bootstrapped user, options and access rules let the app render its shell without waiting for extra requests.
- The employee map loads only when it scrolls into view, using IntersectionObserver.
- Geocoding runs once, on the server, when a profile changes, never on each map view.

### Accessibility

- Interface components such as menus and dialogs came from Headless UI, which provides their keyboard and focus behaviour.
- The portfolio demos go further: semantic controls, visible focus, polite announcements, no meaning carried by colour alone, and a table alternative to the map.

## Related views

- [onboarding-wizard.html](/portfolio/hybrid-wp-react-intranet/views/onboarding-wizard) — onboarding flow
- [notification-center.html](/portfolio/hybrid-wp-react-intranet/views/notification-center) — targeted notifications and kudos
- [interactive-remote-employee-map.html](/portfolio/hybrid-wp-react-intranet/views/interactive-remote-employee-map) — approximate staff locations
- [office-booking-calendar.html](/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar) — desk booking
- [employee-directory.html](/portfolio/hybrid-wp-react-intranet/views/employee-directory)
- [documentation-system.html](/portfolio/hybrid-wp-react-intranet/views/documentation-system)
- [README.md](/portfolio/hybrid-wp-react-intranet) — project summary
