---
title: "Hybrid WordPress + React Intranet"
role: "Sole developer: React front end, WordPress theme and back end"
stack: ["WordPress", "PHP", "React", "Redux Toolkit", "React Router", "Tailwind CSS", "Headless UI", "webpack", "ACF Pro", "REST API"]
status: published
summary: "One place for a remote workforce to connect: a React single-page app built into a WordPress theme, with onboarding, targeted notifications, a staff map, office booking and role-based access."
---

# Hybrid WordPress + React Intranet

## Overview

An intranet built in the early 2020s for a healthcare-sector company with a large remote workforce. Staff signed in once and found news, events, teams, a searchable directory, a map of where colleagues were based, training, documentation and office booking in one place.

This case study is anonymised: the company is described only by its sector, and every person, place and message in the demos is fictional.

### The problem

Most of the workforce was remote and spread across many locations. People had no single place to find colleagues, follow company news, learn how things worked when they joined, or book space on the days they came into an office. The intranet had to become that central place, and it had to feel like an application rather than a set of web pages.

### The constraint

WordPress was the only platform offered, on managed WordPress hosting, and the host did not support running WordPress headless with a separate front end. Content management, sign-in, the API and the application itself all had to ship together as a WordPress theme.

### The approach

I built the intranet as a React single-page app inside the theme. WordPress stays in charge of what it does well: users and roles, content editing, custom post types and fields, and single sign-on. Before the app starts, the theme's page template checks the visitor on the server. Logged-out visitors go to the login page, new users who have not finished onboarding go to the onboarding flow, and pages their role may not see are refused. The template then hands the app the current user, site options, a security token for the API and that user's access rules, and React takes over routing and rendering. Everything after that comes from a custom REST API.

## My role

I was the sole developer, responsible for the theme, the custom REST API, the data model and the whole React application. A UI/UX designer produced the designs in Figma, and I turned them into the interface and the behaviour behind it.

Everything was hand-coded, before AI-assisted coding tools were part of my workflow. It was also my first substantial React project, after about three years of working mainly in Vue, so I learned React, Redux Toolkit and React Router in depth while delivering a full product.

## Views in this project

Each view is an illustrative example rebuilt with fictional sample data. Nothing in them comes from the real intranet, and nothing you do in them is saved.

| File | Title | Type |
| --- | --- | --- |
| [onboarding-wizard.html](/portfolio/hybrid-wp-react-intranet/views/onboarding-wizard) | Onboarding Wizard | Interactive demo (sample data) |
| [notification-center.html](/portfolio/hybrid-wp-react-intranet/views/notification-center) | Notification Center | Interactive demo (sample data) |
| [interactive-remote-employee-map.html](/portfolio/hybrid-wp-react-intranet/views/interactive-remote-employee-map) | Interactive Remote Employee Map | Interactive demo (sample data) |
| [office-booking-calendar.html](/portfolio/hybrid-wp-react-intranet/views/office-booking-calendar) | Office Booking Calendar | Interactive demo (sample data) |
| [employee-directory.html](/portfolio/hybrid-wp-react-intranet/views/employee-directory) | Employee Directory | Placeholder panel |
| [documentation-system.html](/portfolio/hybrid-wp-react-intranet/views/documentation-system) | Documentation System | Placeholder panel |

> [!note]
> Views use fictional sample data and placeholder branding. The office booking demo shows desk booking for one sample week; the real feature booked meeting rooms against each room's live calendar.

## Highlights

### Features

- **Onboarding that can't be skipped.** New users are redirected on the server until they finish a short series of training pages written by administrators. Completing it unlocks the dashboard header and navigation.
- **Targeted notifications.** Administrators address a notification to everyone, to whole teams or to named people. Each person has their own unseen and seen lists, and news posts can notify the whole company.
- **Peer kudos.** Colleagues send each other preset messages such as High Five, Great Job or Thank You, which appear in a feed alongside company announcements.
- **Remote employee map.** Each profile's city and state is geocoded on the server, markers are offset so no one's exact location is shown, the map loads only when it scrolls into view, and every marker opens that person's profile.
- **Office booking.** Room availability comes from each room's Google Calendar through a service account, and a booking request creates the calendar event and invites the attendees.
- **Role-based access.** Administrators choose which roles can use each area (support, resources, directory, teams, training and the office hub), and search only returns posts the current role may see.
- **Single sign-on.** Staff sign in through Okta using SAML, accounts are provisioned through SCIM, and a separate fallback login page covers the cases single sign-on cannot.
- **People and teams.** Department and team spaces, profiles with managers and direct reports, badges, open positions, events, birthdays and work anniversaries, and documentation searchable by category.

### Lessons learned

Going back over this codebase for the write-up, a few years after launch, showed me how much my approach has changed since. The intranet is still in daily use and runs as it was originally built. I've proposed a phased post-launch refactor to the client covering the points below. That work hasn't been budgeted yet, so these are open items, not solved ones.

- **Fan-out on save does not scale.** Saving a notification looped over every user to update their unseen list, so the work grew with the size of the company. A custom table, or a queued background job, would scale better. An early return inside that loop could also stop the fan-out partway, leaving some people without the notification.
- **Secrets belong in environment configuration.** Integration credentials should never sit in a theme or any other directory the web server can reach. A private location or environment configuration is now my default.
- **Generalise locations once.** Map offsets were randomised on every render, so markers shifted slightly each time the map was drawn. Storing one offset per person would keep the privacy benefit and make the map stable.
- **Type the contract between PHP and React.** A lot of state arrived through one global bootstrap object. Typed contracts, with TypeScript on the React side, would catch mismatches earlier.
- **Weigh headless or blocks today.** With hosting that supports it, a headless WordPress back end or a block-based approach would remove much of the custom glue between the theme and the app.

> [!note] Status
> Proposed to the client as a phased refactor; waiting on budget.

## Related documents

- [technical-requirements.md](/portfolio/hybrid-wp-react-intranet/technical-requirements) — architecture, integrations, data model and requirements
