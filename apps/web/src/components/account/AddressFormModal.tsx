import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Modal, ModalClose, ModalTitle, useToast } from "@yrs/ui";
import { addressInputSchema } from "@yrs/shared";
import type { Address, AddressInput } from "@yrs/shared";
import { useCreateAddress, useUpdateAddress } from "../../hooks/useAddresses";

const EMPTY_VALUES: AddressInput = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export interface AddressFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address | null;
}

export function AddressFormModal({ open, onOpenChange, address }: AddressFormModalProps) {
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const { showToast } = useToast();
  const isEditing = Boolean(address);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        address
          ? {
              label: address.label ?? "",
              fullName: address.fullName,
              phone: address.phone,
              line1: address.line1,
              line2: address.line2 ?? "",
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
              isDefault: address.isDefault,
            }
          : EMPTY_VALUES,
      );
    }
  }, [open, address, reset]);

  function onSubmit(values: AddressInput) {
    const mutation = isEditing && address ? updateAddress.mutateAsync({ id: address.id, input: values }) : createAddress.mutateAsync(values);
    mutation
      .then(() => {
        showToast(isEditing ? "Address updated" : "Address added");
        onOpenChange(false);
      })
      .catch((error) => showToast(error instanceof Error ? error.message : "Couldn't save that address"));
  }

  const isPending = createAddress.isPending || updateAddress.isPending;

  return (
    <Modal open={open} onOpenChange={onOpenChange} ariaLabel={isEditing ? "Edit address" : "Add address"} className="max-w-[560px]">
      <ModalClose />
      <div className="p-8">
        <ModalTitle className="font-display text-xl text-ink">{isEditing ? "Edit address" : "Add a new address"}</ModalTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Label (optional)" placeholder="Home, Office…" error={errors.label?.message} {...register("label")} />
          <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
          <Input label="Phone" placeholder="10-digit mobile number" error={errors.phone?.message} {...register("phone")} />
          <Input label="PIN code" placeholder="6-digit PIN code" error={errors.postalCode?.message} {...register("postalCode")} />
          <Input label="Address line 1" className="sm:col-span-2" error={errors.line1?.message} {...register("line1")} />
          <Input label="Address line 2 (optional)" className="sm:col-span-2" error={errors.line2?.message} {...register("line2")} />
          <Input label="City" error={errors.city?.message} {...register("city")} />
          <Input label="State" error={errors.state?.message} {...register("state")} />
          <Input label="Country" error={errors.country?.message} {...register("country")} />
          <label className="flex items-center gap-2 self-end pb-3 text-sm text-ink-soft">
            <input type="checkbox" {...register("isDefault")} className="h-4 w-4 rounded border-line accent-gold" />
            Set as default address
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" isLoading={isPending}>
              Save address
            </Button>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
