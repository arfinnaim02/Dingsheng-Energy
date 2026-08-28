"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PaymentStatus = "PENDING" | "PAID";

type Props = {
  orderId: string;
  initialStatus: PaymentStatus;
  provider: string | null;
};

function paymentMethodLabel(provider: string | null) {
  switch (provider) {
    case "BANK_TRANSFER":
      return "Bank Transfer";

    case "LETTER_OF_CREDIT":
      return "Letter of Credit (L/C)";

    case "APPROVED_CREDIT_TERMS":
      return "Approved Dealer Credit Terms";

    case "MANUAL_COMMERCIAL_AGREEMENT":
      return "Manual Commercial Agreement";

    default:
      return "Not specified";
  }
}

export function OrderPaymentControl({
  orderId,
  initialStatus,
  provider,
}: Props) {
  const router = useRouter();

  const [status, setStatus] =
    useState<PaymentStatus>(initialStatus);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updatePayment() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update payment status.",
        );
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update payment status.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[#e1ebe7] pt-5">
      <div className="text-xs font-black uppercase tracking-[.08em] text-[#71838b]">
        Payment verification
      </div>

      <div className="mt-2 rounded-lg bg-[#f6f8f7] p-3 text-xs text-[#657983]">
        <strong>Method:</strong>{" "}
        {paymentMethodLabel(provider)}
      </div>

      <label className="mt-4 block text-xs font-black text-[#526872]">
        Payment status
      </label>

      <select
        value={status}
        disabled={loading}
        onChange={(event) =>
          setStatus(
            event.target.value as PaymentStatus,
          )
        }
        className="mt-2 w-full rounded-md border border-[#d8e4df] bg-white px-3 py-3 text-sm"
      >
        <option value="PENDING">
          Pending Verification
        </option>

        <option value="PAID">
          Paid / Verified
        </option>
      </select>

      <button
        type="button"
        disabled={loading}
        onClick={updatePayment}
        className="btn btn-secondary mt-3 w-full disabled:opacity-50"
      >
        {loading
          ? "Updating Payment..."
          : "Update Payment Status"}
      </button>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}