# Holly 2.0 Web Application

This is the web application for the Holly 2.0 project, built using React, Vite, and TypeScript. The application serves as a personal AI assistant with a focus on cybersecurity.

## Project Structure

The project is organized as follows:

```
holly-2.0
├── apps
│   └── web
│       ├── public
│       │   └── vite.svg
│       ├── src
│       │   ├── components
│       │   │   ├── Header.tsx        # Top bar component
│       │   │   └── Sidebar.tsx       # Sidebar navigation component
│       │   ├── hooks
│       │   │   └── useSidebar.ts      # Custom hook for sidebar state
│       │   ├── pages
│       │   │   ├── Dashboard.tsx      # Dashboard page component
│       │   │   ├── Alerts.tsx         # Alerts page component
│       │   │   ├── Vault.tsx          # Vault page component
│       │   │   └── Settings.tsx       # Settings page component
│       │   ├── store
│       │   │   └── uiStore.ts         # Zustand store for UI state
│       │   ├── styles
│       │   │   └── main.css           # Main CSS styles
│       │   ├── App.tsx                 # Main application layout
│       │   ├── main.tsx                # Entry point of the application
│       │   └── router.tsx              # Application routing
│       ├── index.html                  # Main HTML file
│       ├── package.json                # NPM configuration
│       ├── tsconfig.json               # TypeScript configuration
│       ├── vite.config.ts              # Vite configuration
│       └── README.md                   # Documentation for the web application
└── README.md                           # Documentation for the overall Holly 2.0 project
```

## Getting Started

To get started with the development of the Holly 2.0 web application, follow these steps:

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd holly-2.0/apps/web
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Run the application:**
   ```
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to view the application.

## Features

- **Dark Mode:** The application supports a dark mode for better visibility in low-light environments.
- **Modular Structure:** The code is organized into components, pages, and hooks for better maintainability.
- **Routing:** The application uses React Router for navigation between different pages.

## Contributing

Contributions are welcome! Please follow the guidelines for making pull requests and ensure that your code adheres to the project's coding standards.

## License

This project is licensed under the MIT License. See the LICENSE file for details.