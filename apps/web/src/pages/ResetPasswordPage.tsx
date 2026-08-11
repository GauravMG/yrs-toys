import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input, useToast } from "@yrs/ui";
import { resetPasswordSchema } from "@yrs/shared";
import type { ResetPasswordInput } from "@yrs/shared";
import { useResetPassword } from "../hooks/useAuth";
import { AuthCard } from "../components/auth/AuthCard";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  function onSubmit(values: ResetPasswordInput) {
    resetPassword.mutate(values, {
      onSuccess: () => {
        showToast("Password reset — please sign in");
        navigate("/login", { replace: true });
      },
      onError: (error) => showToast(error instanceof Error ? error.message : "That reset link is invalid or expired"),
    });
  }

  if (!token) {
    return (
      <AuthCard title="Invalid reset link">
        <p className="text-sm text-ink-soft">This password reset link is missing its token. Please request a new one.</p>
        <Link to="/forgot-password" className="mt-6 block text-center text-sm font-semibold text-gold-dark hover:underline">
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password" subtitle="Choose a new password for your account">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <input type="hidden" {...register("token")} />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Button type="submit" isLoading={resetPassword.isPending} className="mt-2">
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}
