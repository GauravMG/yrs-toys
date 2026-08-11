import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, useToast } from "@yrs/ui";
import { changePasswordSchema, updateProfileSchema } from "@yrs/shared";
import type { ChangePasswordInput, UpdateProfileInput } from "@yrs/shared";
import { useAuth, useChangePassword } from "../../hooks/useAuth";
import { useUpdateProfile } from "../../hooks/useProfile";

export function ProfilePage() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const { showToast } = useToast();

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user?.fullName ?? "", phone: user?.phone ?? "" },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  function onProfileSubmit(values: UpdateProfileInput) {
    updateProfile.mutate(values, {
      onSuccess: () => showToast("Profile updated"),
      onError: (error) => showToast(error instanceof Error ? error.message : "Couldn't update your profile"),
    });
  }

  function onPasswordSubmit(values: ChangePasswordInput) {
    changePassword.mutate(values, {
      onSuccess: () => {
        showToast("Password changed");
        passwordForm.reset({ currentPassword: "", newPassword: "" });
      },
      onError: (error) => showToast(error instanceof Error ? error.message : "Couldn't change your password"),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-line bg-panel p-5">
        <h2 className="mb-4 font-display text-lg">Profile details</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4 sm:max-w-sm">
          <Input label="Email" value={user?.email ?? ""} disabled />
          <Input
            label="Full name"
            error={profileForm.formState.errors.fullName?.message}
            {...profileForm.register("fullName")}
          />
          <Input
            label="Phone"
            placeholder="10-digit mobile number"
            error={profileForm.formState.errors.phone?.message}
            {...profileForm.register("phone")}
          />
          <Button type="submit" isLoading={updateProfile.isPending} className="self-start">
            Save changes
          </Button>
        </form>
      </div>

      <div className="rounded-lg border border-line bg-panel p-5">
        <h2 className="mb-4 font-display text-lg">Change password</h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4 sm:max-w-sm">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword")}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword")}
          />
          <Button type="submit" isLoading={changePassword.isPending} className="self-start">
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
