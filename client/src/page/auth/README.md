# Auth Pages & Styles Documentation

This README explains the structure, logic, and styling of the authentication-related files in this project:

- `Sign-in.tsx`
- `Sign-up.tsx`
- `GoogleOAuthFailure.tsx`
- `login-signup.css`

---

## 1. Sign-in.tsx

**Purpose:**
- Implements the login page for users.
- Handles form validation, login API call, error handling, and navigation.

**Key Features:**
- Uses `react-hook-form` and `zod` for form state and validation.
- Uses `@tanstack/react-query` for async login mutation.
- Navigates to a return URL or the user's workspace on success.
- Shows error messages using a toast hook.
- Includes a Google OAuth login button.
- Styled with classes from `login-signup.css`.

**UI Structure:**
- Decorative background using multiple flex/grid containers.
- Main form with email, password, and a 'stay signed in' checkbox.
- Footer with sign-up link and other info.

---

## 2. Sign-up.tsx

**Purpose:**
- Implements the registration page for new users.
- Handles form validation, registration API call, error handling, and navigation.

**Key Features:**
- Uses `react-hook-form` and `zod` for form state and validation.
- Uses `@tanstack/react-query` for async registration mutation.
- Navigates to the project setup page on success.
- Shows error messages using a toast hook.
- Includes a Google OAuth signup button.
- Styled with classes from `login-signup.css`.

**UI Structure:**
- Decorative background using multiple flex/grid containers.
- Main form with name, email, and password fields.
- Footer with sign-in link and other info.

---

## 3. GoogleOAuthFailure.tsx

**Purpose:**
- Displays an error page when Google OAuth authentication fails.

**Key Features:**
- Shows a clear error message and a button to return to the login page.
- Uses a card layout for the error message.
- Includes the app logo and name at the top.
- Uses React Router's `useNavigate` for navigation.
- Styled with utility classes (likely from Tailwind CSS or similar).

---

## 4. login-signup.css

**Purpose:**
- Provides all custom CSS for the login and signup pages.

**Key Features:**
- Resets and base styles for all elements.
- Layout classes for flex, grid, and alignment.
- Background and box styles for the decorative elements.
- Form and input styles for a modern, clean look.
- Animations for background elements to add visual interest.
- Error message styling for form validation feedback.

**Notable Classes:**
- `.login-root`: Main container for auth pages.
- `.loginbackground`, `.loginbackground-gridContainer`: Decorative backgrounds.
- `.formbg`, `.formbg-inner`: Form container and padding.
- `.field`, `.form-error`: Form field and error message styling.
- `.footer-link`, `.listing`: Footer and link styling.

---

## How These Files Work Together

- The `Sign-in.tsx` and `Sign-up.tsx` components provide the main authentication UI and logic, using the shared CSS for a consistent look.
- Both pages use the same background and layout structure, ensuring a unified user experience.
- The `GoogleOAuthFailure.tsx` page provides a fallback for failed Google sign-in attempts, keeping the user informed and offering a way back to login.
- All pages are responsive and visually appealing, with clear error feedback and smooth navigation.

---

## Customization & Extension

- To change the look and feel, edit `login-signup.css`.
- To add more fields or validation, update the form schema and UI in the relevant `.tsx` file.
- To support more OAuth providers, add new buttons/components similar to `GoogleOauthButton`.
- For additional error handling or user feedback, use the `toast` hook or extend the UI as needed.

---

## Requirements

- React
- react-router-dom
- react-hook-form
- zod
- @tanstack/react-query
- (Optional) Tailwind CSS or similar utility CSS for some classes

---

## File Locations

- Pages: `client/src/page/auth/`
- Styles: `client/src/page/auth/login-signup.css`

---

For further details, see the comments in each file.
