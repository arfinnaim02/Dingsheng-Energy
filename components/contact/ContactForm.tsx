"use client";

import {
  FormEvent,
  useState,
} from "react";

const initialForm = {
  fullName: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  inquiryType: "Product",
  requirement: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] =
    useState(initialForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function patch(
    key: keyof typeof initialForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/contact",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(form),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to submit your request.",
        );
      }

      setSuccess(
        `Thank you. Your request ${result.reference} has been received. Our team will contact you shortly.`,
      );

      setForm(initialForm);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="form-grid mt-7"
      onSubmit={submit}
    >
      <div className="field">
        <label>Full Name *</label>

        <input
          required
          maxLength={120}
          value={form.fullName}
          onChange={(event) =>
            patch(
              "fullName",
              event.target.value,
            )
          }
          placeholder="Your name"
        />
      </div>

      <div className="field">
        <label>Company *</label>

        <input
          required
          maxLength={160}
          value={form.company}
          onChange={(event) =>
            patch(
              "company",
              event.target.value,
            )
          }
          placeholder="Company name"
        />
      </div>

      <div className="field">
        <label>Email *</label>

        <input
          required
          type="email"
          maxLength={200}
          value={form.email}
          onChange={(event) =>
            patch(
              "email",
              event.target.value,
            )
          }
          placeholder="name@company.com"
        />
      </div>

      <div className="field">
        <label>Phone / WhatsApp</label>

        <input
          maxLength={60}
          value={form.phone}
          onChange={(event) =>
            patch(
              "phone",
              event.target.value,
            )
          }
          placeholder="+..."
        />
      </div>

      <div className="field">
        <label>Country</label>

        <input
          maxLength={100}
          value={form.country}
          onChange={(event) =>
            patch(
              "country",
              event.target.value,
            )
          }
          placeholder="Country"
        />
      </div>

      <div className="field">
        <label>Inquiry Type</label>

        <select
          value={form.inquiryType}
          onChange={(event) =>
            patch(
              "inquiryType",
              event.target.value,
            )
          }
        >
          <option>Product</option>
          <option>Engineering / EPC</option>
          <option>LPG Trading</option>
          <option>Dealer Access</option>
          <option>Service</option>
          <option>Other</option>
        </select>
      </div>

      <div className="field span-2">
        <label>
          Requirement Details *
        </label>

        <textarea
          required
          minLength={10}
          maxLength={10000}
          value={form.requirement}
          onChange={(event) =>
            patch(
              "requirement",
              event.target.value,
            )
          }
          placeholder="Product, capacity, quantity, delivery location, project scope or technical requirement..."
        />
      </div>

      {/* Hidden bot-protection field */}
      <div
        className="hidden"
        aria-hidden="true"
      >
        <label>Website</label>

        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) =>
            patch(
              "website",
              event.target.value,
            )
          }
        />
      </div>

      {error && (
        <div className="span-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <div className="span-2">
        <button
          disabled={submitting}
          type="submit"
          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Submitting..."
            : "Submit Request →"}
        </button>
      </div>
    </form>
  );
}