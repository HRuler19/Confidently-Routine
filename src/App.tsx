import { Router, Route, Navigate } from "@solidjs/router";
import { Show, type ParentProps } from "solid-js";
import { user } from "./lib/stores";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyRoutine from "./pages/MyRoutine";
import Tasks from "./pages/Tasks";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";

/** Wraps every app page: bounce to /login when no user session exists. */
function Protected(props: ParentProps) {
  return (
    <Show when={user()} fallback={<Navigate href="/login" />}>
      <Layout>{props.children}</Layout>
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
