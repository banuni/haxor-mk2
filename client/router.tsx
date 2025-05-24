import {
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { App } from "./app";
import { PlayerPage } from "./pages/player";
import { MasterPage } from "./pages/master";

// Create a root route
const rootRoute = createRootRoute({
  component: App,
});

// Create your page routes
const playerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/player",
  component: PlayerPage,
});

const masterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/master",
  component: MasterPage,
});

// Create the router
const routeTree = rootRoute.addChildren([playerRoute, masterRoute]);

export const router = createRouter({ routeTree });

// Register the router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
