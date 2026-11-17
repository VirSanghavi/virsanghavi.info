"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="admin-login">
      <label htmlFor="admin-password">Password</label>
      <div className="admin-login-row">
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "admin-login-error" : undefined}
        />
        <button type="submit" disabled={pending}>
          {pending ? "Checking" : "Enter"}
        </button>
      </div>
      {state.error ? (
        <p id="admin-login-error" className="admin-login-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
