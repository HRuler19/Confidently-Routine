import { Router, Route, Navigate } from "@solidjs/router";
import { Show, Suspense, lazy, type ParentProps } from "solid-js";
import { user } from "./lib/stores";
import Layout from "./components/Layout";
import Login from "./pages/Login";

// Lazy: a session only ever needs one of these per page load, so there's
// no reason to ship all five in the initial bundle. Login stays eager -
// it's the first thing an unauthenticated visitor sees, and it's small.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyRoutine = lazy(() => import("./pages/MyRoutine"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Notes = lazy(() => import("./pages/Notes"));
const Settings = lazy(() => import("./pages/Settings"));

function RouteLoadingFallback() {
  return (
    <div class="flex items-center justify-center py-20">
      <div class="size-8 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}

/** Wraps every app page: bounce to /login when no user session exists. */
function Protected(props: ParentProps) {
  return (
    <Show when={user()} fallback={<Navigate href="/login" />}>
      <Layout>
        <Suspense fallback={<RouteLoadingFallback />}>{props.children}</Suspense>
      </Layout>
    </Show>
  );
}

export default function App() {
  return (
    <Router>
      <Route
        path="/login"
        component={() => (
          <Show when={!user()} fallback={<Navigate href="/" />}>
            <Login />
          </Show>
        )}
      />
      <Route path="/" component={Protected}>
        <Route path="/" component={Dashboard} />
        <Route path="/my-routine" component={MyRoutine} />
        <Route path="/routines" component={Tasks} />
        <Route path="/notes" component={Notes} />
        <Route path="/settings" component={Settings} />
      </Route>
      <Route path="*" component={() => <Navigate href="/" />} />
    </Router>
  );
}
