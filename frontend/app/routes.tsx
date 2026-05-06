import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Pos } from "./pages/Pos";
import { Inventory } from "./pages/Inventory";
import { HR } from "./pages/HR";
import { Config } from "./pages/Config";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/pos" replace /> },
      { path: "pos", Component: Pos },
      { path: "inventory", Component: Inventory },
      { path: "hr", Component: HR },
      { path: "config", Component: Config },
    ],
  },
]);
