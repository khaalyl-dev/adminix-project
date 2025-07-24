# Client Setup Guide

This README provides instructions for setting up and running the frontend (client) of the AdminiX project.

---

## Folder Structure

```
client/
├── src/
│   ├── assets/         # Static assets (images, icons, etc.)
│   ├── components/     # Reusable UI and feature components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API utilities, helpers
│   ├── page/           # Main pages (workspace, project, auth, errors, etc.)
│   ├── routes/         # React Router route definitions
│   ├── types/          # TypeScript types/interfaces
│   ├── constant/       # App-wide constants
│   └── main.tsx        # App entry point
├── public/             # Public files (images, favicon, etc.)
├── package.json        # Client dependencies and scripts
├── vite.config.ts      # Vite config
├── tailwind.config.js  # Tailwind CSS config
├── tsconfig.json       # TypeScript config
└── ...
```

---

## Prerequisites
- Node.js (v16 or higher recommended)
- npm (comes with Node.js)

## Environment Variables

```
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
