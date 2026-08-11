import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation } from "react-router-dom";
import { Button, Input } from "@yrs/ui";
import { useLogin } from "../hooks/useAuth";
import { isAdminSession, useAuthStore } from "../store/auth-store";
import { ErrorBanner } from "../components/ui/ErrorBanner";

const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  // Select primitives individually — a selector returning a fresh object
  // literal every render trips Zustand's useSyncExternalStore into an
  // infinite render loop (see components/RequireAdmin.tsx for the same fix).
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  if (isAdminSession({ user, accessToken })) {
    const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  const onSubmit = handleSubmit((values) => {
    login.mutate(values);
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-panel p-8 shadow-card">
        <div className="mb-6 text-center">
          <p className="font-display text-2xl text-ink">YRS Toys</p>
          <p className="mt-1 text-sm text-ink-soft">Admin sign in</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {login.isError && <ErrorBanner error={login.error} />}

          <Button type="submit" variant="solid" className="mt-2" isLoading={login.isPending}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
