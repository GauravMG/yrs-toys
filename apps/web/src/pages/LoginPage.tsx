import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Input, useToast } from "@yrs/ui";
import { loginSchema } from "@yrs/shared";
import type { LoginInput } from "@yrs/shared";
import { useLogin } from "../hooks/useAuth";
import { AuthCard } from "../components/auth/AuthCard";

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/account";

  function onSubmit(values: LoginInput) {
    login.mutate(values, {
      onSuccess: () => navigate(redirectTo, { replace: true }),
      onError: (error) => showToast(error instanceof Error ? error.message : "Couldn't sign you in"),
    });
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your YRS Toys account">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-semibold text-gold-dark hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" isLoading={login.isPending} className="mt-2">
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link to="/register" className="font-semibold text-gold-dark hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
