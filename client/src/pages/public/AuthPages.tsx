import { Building2, HardHat, UserRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { Logo } from "../../components/ui/Logo";
import { InlineAlert } from "../../components/ui/States";
import { errorMessage } from "../../lib/api";
import { HOME_BY_ROLE } from "../../lib/constants";
import { cx } from "../../lib/cx";
import type { Role } from "../../lib/types";

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Link to="/" aria-label="CivicAI home">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-night-900 lg:block">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="font-display text-4xl font-extrabold leading-tight text-white">
            Report. Track.
            <br />
            <span className="text-brand-300">Resolve.</span>
          </p>
          <p className="mt-4 max-w-md text-slate-300">
            Every complaint gets a reference number and a visible timeline, from the moment it's submitted to the photo of the
            finished fix.
          </p>
        </div>
      </div>
    </div>
  );
}

const ROLES: { value: Role; label: string; icon: typeof UserRound }[] = [
  { value: "citizen", label: "Resident", icon: UserRound },
  { value: "worker", label: "Field worker", icon: HardHat },
  { value: "admin", label: "Admin", icon: Building2 },
];

// Remounts the form when ?role= changes, e.g. following a footer link while
// already on the login page.
export function LoginPage() {
  const [params] = useSearchParams();
  const initialRole = (ROLES.find((r) => r.value === params.get("role"))?.value || "citizen") as Role;
  return <LoginForm key={initialRole} initialRole={initialRole} />;
}

function LoginForm({ initialRole }: { initialRole: Role }) {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  const from = (location.state as { from?: string } | null)?.from;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const account = await signIn(email, password, role);
      navigate(from && from.startsWith(`/${account.role}`) ? from : HOME_BY_ROLE[account.role], { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Sign in failed"));
      setLoading(false);
    }
  };

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to report issues, manage complaints or update your tasks.">
      <div role="radiogroup" aria-label="Account type" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {ROLES.map((item) => (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={role === item.value}
            onClick={() => setRole(item.value)}
            className={cx(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition sm:flex-row sm:justify-center sm:text-sm",
              role === item.value ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {error && <InlineAlert tone="error">{error}</InlineAlert>}
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!email || !password}>
          Sign in
        </Button>
      </form>

      {role === "citizen" ? (
        <p className="mt-6 text-center text-sm text-slate-600">
          New to CivicAI?{" "}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Create a free account
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-center text-sm text-slate-500">
          {role === "worker" ? "Worker accounts are created by your administrator." : "Admin access is granted by the platform operator."}
        </p>
      )}
    </AuthFrame>
  );
}

const passwordProblem = (value: string) => {
  if (value.length < 8) return "Use at least 8 characters";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Include at least one letter and one number";
  return "";
};

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  const errors = {
    fullName: form.fullName.trim().length < 2 ? "Enter your full name" : "",
    email: /^\S+@\S+\.\S+$/.test(form.email.trim()) ? "" : "Enter a valid email address",
    password: passwordProblem(form.password),
  };
  const valid = !errors.fullName && !errors.email && !errors.password;

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const blur = (key: string) => () => setTouched((prev) => ({ ...prev, [key]: true }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ fullName: true, email: true, password: true });
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/citizen", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Registration failed"));
      setLoading(false);
    }
  };

  return (
    <AuthFrame title="Create your account" subtitle="Free for residents. Takes less than a minute.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <InlineAlert tone="error">{error}</InlineAlert>}
        <Input label="Full name" required autoComplete="name" value={form.fullName} onChange={set("fullName")} onBlur={blur("fullName")} error={touched.fullName ? errors.fullName : ""} />
        <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} onBlur={blur("email")} error={touched.email ? errors.email : ""} />
        <Input label="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} hint="Only visible to administrators" />
        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set("password")}
          onBlur={blur("password")}
          error={touched.password ? errors.password : ""}
          hint="At least 8 characters with a letter and a number"
        />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
        </Button>
        <p className="text-center text-xs text-slate-500">
          By creating an account you agree to the{" "}
          <Link to="/terms" className="underline">terms</Link> and{" "}
          <Link to="/privacy" className="underline">privacy notice</Link>.
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
      </p>
    </AuthFrame>
  );
}
