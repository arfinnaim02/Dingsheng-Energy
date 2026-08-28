"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

const initialForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  country: "",
  businessType: "LPG Distributor",
  jobTitle: "",
  website: "",
  interests: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

export function DealerRegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(
    field: keyof typeof initialForm,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/dealer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          businessType: form.businessType,
          jobTitle: form.jobTitle,
          website: form.website,
          interests: form.interests,
          password: form.password,
          acceptedTerms: form.acceptedTerms,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to submit application.",
        );
      }

      setSuccess(result.message);
      setForm(initialForm);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit application.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card p-8 text-center md:p-12">
        <div className="eyebrow">Application received</div>

        <h2 className="mt-3 text-3xl font-extrabold">
          Thank you for registering
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#657983]">
          {success}
        </p>

        <Link
          href="/dealer/login"
          className="btn btn-primary mt-7"
        >
          Go to Dealer Login →
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-7 md:p-10">
      <div className="eyebrow">Company application</div>

      <h2 className="mt-2 text-3xl font-extrabold">
        Register for dealer access
      </h2>

      <p className="mt-3 text-sm leading-7 text-[#657983]">
        Submit your company details. Access to protected pricing
        requires administrator approval.
      </p>

      <form onSubmit={submit} className="form-grid mt-8">
        <div className="field">
          <label>Company Name *</label>
          <input
            value={form.companyName}
            onChange={(event) =>
              update("companyName", event.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label>Contact Person *</label>
          <input
            value={form.contactName}
            onChange={(event) =>
              update("contactName", event.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label>Business Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              update("email", event.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label>Phone *</label>
          <input
            value={form.phone}
            onChange={(event) =>
              update("phone", event.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label>Country *</label>
          <input
            value={form.country}
            onChange={(event) =>
              update("country", event.target.value)
            }
            required
          />
        </div>

        <div className="field">
          <label>Business Type</label>
          <select
            value={form.businessType}
            onChange={(event) =>
              update("businessType", event.target.value)
            }
          >
            <option>LPG Distributor</option>
            <option>Industrial Customer</option>
            <option>Engineering / EPC</option>
            <option>Trading Company</option>
            <option>Other</option>
          </select>
        </div>

        <div className="field">
          <label>Job Title</label>
          <input
            value={form.jobTitle}
            onChange={(event) =>
              update("jobTitle", event.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Company Website</label>
          <input
            value={form.website}
            onChange={(event) =>
              update("website", event.target.value)
            }
            placeholder="https://..."
          />
        </div>

        <div className="field span-2">
          <label>Products / Services of Interest</label>
          <textarea
            value={form.interests}
            onChange={(event) =>
              update("interests", event.target.value)
            }
          />
        </div>

        <div className="field">
          <label>Password *</label>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              update("password", event.target.value)
            }
            required
            minLength={8}
          />
        </div>

        <div className="field">
          <label>Confirm Password *</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) =>
              update("confirmPassword", event.target.value)
            }
            required
            minLength={8}
          />
        </div>

        <div className="span-2">
          <label className="flex items-start gap-2 text-xs text-[#657983]">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(event) =>
                update("acceptedTerms", event.target.checked)
              }
              required
            />

            <span>
              I agree to the dealer terms and privacy notice.
            </span>
          </label>
        </div>

        {error && (
          <div className="span-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="span-2">
          <button
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-60"
          >
            {loading
              ? "Submitting Application..."
              : "Submit Application →"}
          </button>
        </div>
      </form>
    </div>
  );
}