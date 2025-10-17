import { createBrowserRouter } from "react-router-dom";
import AppShell from "./ui/AppShell";
import Dashboard from "./views/Dashboard";
import Settings from "./views/Settings";
import Devices from "./views/Devices";
import Notifications from "./views/Notifications";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
  { index: true, element: <Dashboard /> },
  { path: "settings", element: <Settings /> },
  { path: "devices", element: <Devices /> },
  { path: "notifications", element: <Notifications /> },
    ],
  },
]);
