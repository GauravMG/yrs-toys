import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button, Input } from "@yrs/ui";
import { forgotPasswordSchema } from "@yrs/shared";
import type { ForgotPasswordInput } from "@yrs/shared";
import { useForgotPassword } from "../hooks/useAuth";
import { AuthCard } from "../components/auth/AuthCard";

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  function onSubmit(values: ForgotPasswordInput) {
    forgotPassword.mutate(values, { onSuccess: () => setSubmitted(true) });
  }

  if (submitted) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-ink-soft">
          If an account exists for that email, we've sent a link to reset your password. It should arrive shortly.
        </p>
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-gold-dark hover:underline">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Button type="submit" isLoading={forgotPassword.isPending} className="mt-2">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link to="/login" className="font-semibold text-gold-dark hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
