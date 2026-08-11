import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Card, Input, useToast } from "@yrs/ui";
import { passwordSchema } from "@yrs/shared";
import { useAuthStore } from "../../store/auth-store";
import { useChangePassword, useUpdateProfile } from "../../hooks/useSettings";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { ApiError } from "../../lib/api-client";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(120),
  phone: z
    .union([z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"), z.literal("")])
    .optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: { fullName: user?.fullName ?? "", phone: user?.phone ?? "" },
  });

  function onSubmit(values: ProfileFormValues) {
    updateProfile.mutate(
      { fullName: values.fullName, phone: values.phone || undefined },
      {
        onSuccess: () => showToast("Profile updated."),
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to update profile."),
      },
    );
  }

  return (
    <Card className="max-w-lg p-6">
      <h2 className="mb-4 font-display text-lg text-ink">Your profile</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input id="profile-email" label="Email" value={user?.email ?? ""} disabled />
        <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Phone" error={errors.phone?.message as string | undefined} {...register("phone")} />
        {updateProfile.isError && <ErrorBanner error={updateProfile.error} />}
        <div className="flex justify-end">
          <Button type="submit" variant="solid" isLoading={updateProfile.isPending}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const changePassword = useChangePassword();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordFormSchema) });

  function onSubmit(values: PasswordFormValues) {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          showToast("Password changed.");
          reset();
        },
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to change password."),
      },
    );
  }

  return (
    <Card className="max-w-lg p-6">
      <h2 className="mb-4 font-display text-lg text-ink">Change password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Current password" type="password" error={errors.currentPassword?.message} {...register("currentPassword")} />
        <Input label="New password" type="password" error={errors.newPassword?.message} {...register("newPassword")} />
        <Input label="Confirm new password" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        {changePassword.isError && <ErrorBanner error={changePassword.error} />}
        <div className="flex justify-end">
          <Button type="submit" variant="solid" isLoading={changePassword.isPending}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your admin account." />
      <div className="flex flex-col gap-6">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
}
