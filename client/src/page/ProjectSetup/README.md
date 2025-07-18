# Project Setup Page Documentation

This README explains the structure, logic, and styling of the Project Setup feature:

- `ProjectSetup.tsx`
- `ProjectSetup.css`

---

## 1. ProjectSetup.tsx

**Purpose:**
- Guides new users through a multi-step onboarding process to create a workspace, a project, and initial tasks.
- Provides a live preview of the workspace and project as the user fills out the form.

**Key Features:**
- **Multi-step Form:**
  - Step 1: Enter workspace name and (optional) description.
  - Step 2: Enter project name.
  - Step 3: Enter project description.
  - Step 4: Add up to 5 initial tasks for the project.
- **Live Preview:**
  - The right side of the page shows a browser-like preview of the workspace, project, and tasks as the user types.
  - Uses the `AnimatedLetters` component for smooth text reveal animations.
- **API Integration:**
  - Uses React Query mutations to create the workspace, project, and tasks in sequence.
  - On success, navigates to the new project's page and shows a success toast.
  - On error, shows an error toast.
- **User Experience:**
  - Progress bar at the top of the form.
  - Back/Continue navigation between steps.
  - Prevents submission if required fields are empty or if a request is in progress.

**Component Structure:**
- `AnimatedLetters`: Animates each letter of a string for a smooth reveal effect.
- Main `ProjectSetup` component manages all state and handles the step logic, API calls, and navigation.

---

## 2. ProjectSetup.css

**Purpose:**
- Provides all custom CSS for the Project Setup page.

**Key Features:**
- Responsive, modern layout with a card-like appearance.
- Flexbox and grid for layout, with a split between the form and the live preview.
- Progress bar styling for step indication.
- Styled form inputs, buttons, and animated text.
- Browser-like preview with colored header buttons and avatar.
- Animations for fade-in effects and animated letters.

**Notable Classes:**
- `.page-container`, `.setup-wrapper`, `.setup-left`, `.project-preview-outer`: Layout containers.
- `.progress-bar-container`, `.progress-bar-track`, `.progress-bar-fill`: Progress bar.
- `.input-style`, `.button-primary`, `.button-secondary`: Form and button styling.
- `.browser-preview`, `.browser-preview-header`, `.project-preview-header`: Preview area.
- `.fade-in`, `.fade-in-text`, `.fade-in-letter`: Animations.

---

## How These Files Work Together

- The `ProjectSetup.tsx` component provides a guided onboarding experience for new users, ensuring they set up a workspace, project, and tasks in a logical order.
- The CSS file ensures the page is visually appealing, easy to use, and consistent with the rest of the app.
- The live preview helps users see what their workspace and project will look like before finalizing.

---

## Customization & Extension

- To change the look and feel, edit `ProjectSetup.css`.
- To add more steps or fields, update the state and step logic in `ProjectSetup.tsx`.
- To support more advanced project/task options, extend the form and API calls as needed.

---

## Requirements

- React
- react-router-dom
- @tanstack/react-query

---

## File Locations

- Page: `client/src/page/ProjectSetup/ProjectSetup.tsx`
- Styles: `client/src/page/ProjectSetup/ProjectSetup.css`

---

For further details, see the comments in each file.
