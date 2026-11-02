# Design Introduction

I've got an idea for my portfolio website, which I'd like to start from scratch.

## General details

This website's objective will be to display the projects I've worked on, with real coded examples of what I've built (with anonymous placeholder data and branding) and general details about the project, without discussing the specific client. I have the code and data, but it'll need to be altered from WordPress code to our technical stack. I'll eventually include a blog, but that'll be a phase 2 project.

## Design Direction

I love the way code editors look. I like the simplicity of the UI. I'm curious if we could design a website that displays like a code editor. You can navigate pages (files) in the file explorer on the left, with the following menu structure:

- portfolio
  - hybrid-wp-react-intranet
    - views
      - office-booking-calendar.html
      - interactive-remote-employee-map.html
      - employee-directory.html
      - documentation-system.html
    - README.md (project summary/outline with a table of contents that link)
    - technical-requirements.md (noteworthy technical details)
  - headless-wp-educational-app
    - views
      - lms-scorm-integration.html
      - integrated-point-system.html
      - trackable-award-system.html
      - challenge-interface.html
    - README.md (project summary/outline with a table of contents that link)
    - technical-requirements.md (noteworthy technical details)
  - legal-doc-wp-ordering-system
    - views
      - conditional-gf-woo-order-system.html
      - custom-woo-extension-plugin.html
      - custom-notification-system.html
      - custom-user-dashboard.html
    - README.md (project summary/outline with a table of contents that link)
    - technical-requirements.md (noteworthy technical details)
  - multi-location-inventory-sales-system
    - views
      - multi-location-inventory-sync.html
      - custom-woo-extension-plugin.html
      - custom-order-management.html
      - user-profile-completion-wizard.html
      - location-gated-products.html
    - README.md (project summary/outline with a table of contents that link)
    - technical-requirements.md (noteworthy technical details)
- docs
  - index.html (blog archive)
  - about.html
  - contact.bash
- index.html (home page)
- package.json (my tech stack details, including AI preferences)
- search.tsx (website search page)

When a user clicks on a "Markdown" file, I'd like it displayed similar to how Obsidian renders them in display mode. It'd be awesome if it functioned similiarly, obviously not full featured - paired down for display/website purposes.

When a user clicks on an "HTML" or "tsx" file, I'd like these displayed more as HTML artifacts in Codex or Claude as opposed to actual HTML markup. I don't want to detere non-technical users with confusing syntax.

The package.json is one I'm not sure how to handle visually. I'd like it to stay somewhat true to JSON syntax, but in an easy to read way for none coders.

Contact will be a guided terminal experience in the bottom, right panel in conjunction with whatever page is opened. Ask for the user's name, they hit enter, then ask for their email, and so on.