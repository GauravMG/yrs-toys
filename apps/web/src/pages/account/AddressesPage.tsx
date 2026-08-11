import { useState } from "react";
import { Badge, Button, Spinner, useToast } from "@yrs/ui";
import type { Address } from "@yrs/shared";
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "../../hooks/useAddresses";
import { AddressFormModal } from "../../components/account/AddressFormModal";

export function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  function openCreateModal() {
    setEditingAddress(null);
    setModalOpen(true);
  }

  function openEditModal(address: Address) {
    setEditingAddress(address);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    deleteAddress.mutate(id, {
      onSuccess: () => showToast("Address removed"),
      onError: () => showToast("Couldn't remove that address"),
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg">Saved addresses</h2>
        <Button size="sm" onClick={openCreateModal}>
          Add address
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <p className="rounded-lg border border-line bg-panel p-8 text-center text-sm text-ink-soft">
          You don't have any saved addresses yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} className="flex flex-col gap-2 rounded-lg border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{address.label || "Address"}</span>
                {address.isDefault && <Badge tone="sage">Default</Badge>}
              </div>
              <p className="text-sm text-ink-soft">
                {address.fullName}
                <br />
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.phone}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide">
                <button type="button" onClick={() => openEditModal(address)} className="text-gold-dark hover:underline">
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefaultAddress.mutate(address.id)}
                    className="text-ink-soft hover:text-gold-dark"
                  >
                    Set default
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(address.id)} className="text-terracotta hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressFormModal open={modalOpen} onOpenChange={setModalOpen} address={editingAddress} />
    </div>
  );
}
