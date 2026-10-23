import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

// Minimal typing for Google Identity Services (https://accounts.google.com/gsi/client).
interface GoogleId {
  initialize: (options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;
const loadScript = () => {
  scriptPromise ||= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Google script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

interface Props {
  onCredential: (credential: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

// Renders Google's own button. Hidden unless both the frontend
// (VITE_GOOGLE_CLIENT_ID) and the API (GOOGLE_CLIENT_ID) are configured.
export function GoogleSignInButton({ onCredential, text = "continue_with" }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [state, setState] = useState<"checking" | "ready" | "off" | "error">(CLIENT_ID ? "checking" : "off");

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    api
      .get("/auth/config")
      .then((res) => {
        if (!res.data.googleEnabled) throw new Error("disabled");
        return loadScript();
      })
      .then(() => {
        if (cancelled || !container.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => callback.current(response.credential),
          ux_mode: "popup",
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(container.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          logo_alignment: "left",
          width: Math.min(container.current.offsetWidth || 360, 400),
        });
        setState("ready");
      })
      .catch((error: Error) => !cancelled && setState(error.message === "disabled" ? "off" : "error"));

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (state === "off") return null;

  return (
    <div>
      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div ref={container} className="flex min-h-11 w-full justify-center" aria-label="Sign in with Google" />
      {state === "error" && (
        <p className="mt-2 text-center text-xs text-slate-500">Google sign-in couldn't load. Check your connection or use email instead.</p>
      )}
    </div>
  );
}
