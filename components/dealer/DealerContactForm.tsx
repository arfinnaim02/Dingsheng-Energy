"use client";

import {
  FormEvent,
  useState,
} from "react";

type DealerDetails = {
  companyName: string;
  contactName: string;
  email: string;
  phone:
    | string
    | null;
  country:
    | string
    | null;
};

type Props = {
  dealer: DealerDetails;
};

const initialForm = {
  inquiryType:
    "General Support",

  requirement: "",
};

export function DealerContactForm({
  dealer,
}: Props) {
  const [form, setForm] =
    useState(initialForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/dealer/contact",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            form,
          ),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to submit your message.",
        );
      }

      setSuccess(
        `Your message ${result.reference} has been sent to the Dingsheng administration team.`,
      );

      setForm(initialForm);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your message.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <section className="card p-6">
          <div className="eyebrow">
            Dealer identity
          </div>

          <h2 className="mt-2 text-xl font-black">
            Contact profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#71838b]">
            This verified dealer information
            will be attached automatically
            to your message.
          </p>

          <div className="mt-6 grid gap-5">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Company
              </div>

              <div className="mt-1 font-bold">
                {dealer.companyName}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Contact person
              </div>

              <div className="mt-1 font-bold">
                {dealer.contactName}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Email
              </div>

              <div className="mt-1 break-all font-bold">
                {dealer.email}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Phone
              </div>

              <div className="mt-1 font-bold">
                {dealer.phone ||
                  "Not provided"}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-[.1em] text-[#829198]">
                Country
              </div>

              <div className="mt-1 font-bold">
                {dealer.country ||
                  "Not provided"}
              </div>
            </div>
          </div>
        </section>
      </aside>

      <section className="card p-6 md:p-8">
        <div className="eyebrow">
          Dealer support
        </div>

        <h2 className="mt-2 text-2xl font-black">
          Contact the administration team
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#657983]">
          Send questions about products,
          pricing, RFQs, orders, payments,
          technical requirements or your
          dealer account.
        </p>

        <form
          onSubmit={submit}
          className="mt-7"
        >
          <div className="field">
            <label>
              Contact Category *
            </label>

            <select
              required
              value={
                form.inquiryType
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    inquiryType:
                      event.target
                        .value,
                  }),
                )
              }
            >
              <option value="General Support">
                General Support
              </option>

              <option value="Product Inquiry">
                Product Inquiry
              </option>

              <option value="Dealer Pricing">
                Dealer Pricing
              </option>

              <option value="RFQ Support">
                RFQ Support
              </option>

              <option value="Order Support">
                Order Support
              </option>

              <option value="Payment Support">
                Payment Support
              </option>

              <option value="Technical Support">
                Technical Support
              </option>

              <option value="Account Support">
                Account Support
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div className="field mt-5">
            <label>
              Message / Requirement Details *
            </label>

            <textarea
              required
              minLength={10}
              maxLength={10000}
              className="!min-h-[240px]"
              value={
                form.requirement
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    requirement:
                      event.target
                        .value,
                  }),
                )
              }
              placeholder="Explain your question, affected product, RFQ or order reference, payment concern, required action or technical requirement..."
            />

            <p className="mt-2 text-[11px] leading-5 text-[#829198]">
              Include relevant product,
              RFQ, order or payment
              references when available.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Sending Message..."
              : "Send to Administration →"}
          </button>
        </form>
      </section>
    </div>
  );
}