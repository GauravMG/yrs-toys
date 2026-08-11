import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, useToast } from "@yrs/ui";
import { registerSchema } from "@yrs/shared";
import type { RegisterInput } from "@yrs/shared";
import { useRegister } from "../hooks/useAuth";
import { AuthCard } from "../components/auth/AuthCard";

export function RegisterPage() {
  const registerAccount = useRegister();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  function onSubmit(values: RegisterInput) {
    registerAccount.mutate(values, {
      onSuccess: () => navigate("/account", { replace: true }),
      onError: (error) => showToast(error instanceof Error ? error.message : "Couldn't create your account"),
    });
  }

  return (
    <AuthCard title="Create your account" subtitle="Join YRS Toys for faster checkout and order tracking">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="10-digit mobile number"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" isLoading={registerAccount.isPending} className="mt-2">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-gold-dark hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
