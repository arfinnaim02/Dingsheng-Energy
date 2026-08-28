"use client";

import {
  type FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type DealerProfile = {
  companyName: string;
  contactName: string;
  jobTitle: string | null;
  businessType: string | null;
  phone: string | null;
  country: string | null;
  website: string | null;
  interests: string | null;
};

type Props = {
  profile: DealerProfile;
  email: string;
  emailVerified: boolean;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function DealerAccountManager({
  profile,
  email,
  emailVerified,
}: Props) {
  const router = useRouter();

  const [profileForm, setProfileForm] =
    useState({
      companyName: profile.companyName,
      contactName: profile.contactName,
      jobTitle: profile.jobTitle ?? "",
      businessType:
        profile.businessType ?? "",
      phone: profile.phone ?? "",
      country: profile.country ?? "",
      website: profile.website ?? "",
      interests: profile.interests ?? "",
    });

  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [sendingVerification, setSendingVerification] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [profileSuccess, setProfileSuccess] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  const [
    verificationError,
    setVerificationError,
  ] = useState("");

  const [
    verificationSuccess,
    setVerificationSuccess,
  ] = useState("");

  function patchProfile(
    key: keyof typeof profileForm,
    value: string,
  ) {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function patchPassword(
    key: keyof PasswordForm,
    value: string,
  ) {
    setPasswordForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function sendVerification() {
    if (
      sendingVerification ||
      emailVerified
    ) {
      return;
    }

    setSendingVerification(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      const response = await fetch(
        "/api/dealer/email-verification/send",
        {
          method: "POST",
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to send verification email.",
        );
      }

      setVerificationSuccess(
        result.message ||
          "Verification email sent successfully.",
      );

      router.refresh();
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "Unable to send verification email.",
      );
    } finally {
      setSendingVerification(false);
    }
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch(
        "/api/dealer/account",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "profile",
            ...profileForm,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to update your profile.",
        );
      }

      setProfileSuccess(
        "Company profile updated successfully.",
      );

      router.refresh();
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const response = await fetch(
        "/api/dealer/account",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "password",
            ...passwordForm,
          }),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to change your password.",
        );
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordSuccess(
        "Password changed successfully.",
      );

      router.refresh();
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change your password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <section className="card p-6 md:p-7">
        <div className="eyebrow">
          Company profile
        </div>

        <h2 className="mt-2 text-xl font-extrabold">
          Business and contact details
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#71838b]">
          Keep these details current so Dingsheng Energy
          can contact the correct person regarding orders,
          RFQs, payments and commercial support.
        </p>

        <form
          onSubmit={saveProfile}
          className="form-grid mt-6"
        >
          <div className="field">
            <label>Company Name *</label>

            <input
              value={profileForm.companyName}
              onChange={(event) =>
                patchProfile(
                  "companyName",
                  event.target.value,
                )
              }
              required
              maxLength={160}
            />
          </div>

          <div className="field">
            <label>Primary Contact *</label>

            <input
              value={profileForm.contactName}
              onChange={(event) =>
                patchProfile(
                  "contactName",
                  event.target.value,
                )
              }
              required
              maxLength={160}
            />
          </div>

          <div className="field">
            <label>Job Title</label>

            <input
              value={profileForm.jobTitle}
              onChange={(event) =>
                patchProfile(
                  "jobTitle",
                  event.target.value,
                )
              }
              maxLength={120}
            />
          </div>

          <div className="field">
            <label>Business Type</label>

            <input
              value={profileForm.businessType}
              onChange={(event) =>
                patchProfile(
                  "businessType",
                  event.target.value,
                )
              }
              maxLength={160}
            />
          </div>

          <div className="field">
            <label>Country</label>

            <input
              value={profileForm.country}
              onChange={(event) =>
                patchProfile(
                  "country",
                  event.target.value,
                )
              }
              maxLength={120}
            />
          </div>

          <div className="field">
            <label>Phone / WhatsApp</label>

            <input
              type="tel"
              value={profileForm.phone}
              onChange={(event) =>
                patchProfile(
                  "phone",
                  event.target.value,
                )
              }
              maxLength={80}
            />
          </div>

          <div className="field span-2">
            <label>Company Website</label>

            <input
              type="url"
              value={profileForm.website}
              onChange={(event) =>
                patchProfile(
                  "website",
                  event.target.value,
                )
              }
              placeholder="https://company.com"
              maxLength={500}
            />
          </div>

          <div className="field span-2">
            <label>
              Product and Business Interests
            </label>

            <textarea
              value={profileForm.interests}
              onChange={(event) =>
                patchProfile(
                  "interests",
                  event.target.value,
                )
              }
              maxLength={5000}
              className="!min-h-[150px]"
            />
          </div>

          {(profileError ||
            profileSuccess) && (
            <div
              className={`span-2 rounded-lg border p-4 text-sm ${
                profileError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {profileError ||
                profileSuccess}
            </div>
          )}

          <div className="span-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingProfile
                ? "Saving Profile..."
                : "Save Profile Changes"}
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-6">
        <section className="card p-6 md:p-7">
          <div className="eyebrow">
            Email security
          </div>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold">
                Business email
              </h2>

              <p className="mt-2 break-all text-sm font-bold text-[#526872]">
                {email}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.08em] ${
                emailVerified
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {emailVerified
                ? "Verified"
                : "Not Verified"}
            </span>
          </div>

          <p className="mt-4 text-xs leading-6 text-[#71838b]">
            {emailVerified
              ? "Your business email has been verified. Important account and commercial messages can be delivered securely."
              : "Verify your email to secure your account and confirm that important commercial messages reach the correct address."}
          </p>

          {!emailVerified && (
            <button
              type="button"
              onClick={() =>
                void sendVerification()
              }
              disabled={sendingVerification}
              className="btn btn-secondary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sendingVerification
                ? "Sending Verification..."
                : "Send Verification Email"}
            </button>
          )}

          {(verificationError ||
            verificationSuccess) && (
            <div
              className={`mt-4 rounded-lg border p-4 text-xs leading-6 ${
                verificationError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {verificationError ||
                verificationSuccess}
            </div>
          )}
        </section>

        <section className="card p-6 md:p-7">
          <div className="eyebrow">
            Account security
          </div>

          <h2 className="mt-2 text-xl font-extrabold">
            Change password
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#71838b]">
            Use at least eight characters containing
            letters and numbers.
          </p>

          <form
            onSubmit={changePassword}
            className="mt-6 grid gap-4"
          >
            <div className="field">
              <label>Current Password *</label>

              <input
                type="password"
                value={
                  passwordForm.currentPassword
                }
                onChange={(event) =>
                  patchPassword(
                    "currentPassword",
                    event.target.value,
                  )
                }
                autoComplete="current-password"
                required
              />
            </div>

            <div className="field">
              <label>New Password *</label>

              <input
                type="password"
                value={
                  passwordForm.newPassword
                }
                onChange={(event) =>
                  patchPassword(
                    "newPassword",
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <div className="field">
              <label>
                Confirm New Password *
              </label>

              <input
                type="password"
                value={
                  passwordForm.confirmPassword
                }
                onChange={(event) =>
                  patchPassword(
                    "confirmPassword",
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            {(passwordError ||
              passwordSuccess) && (
              <div
                className={`rounded-lg border p-4 text-sm ${
                  passwordError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {passwordError ||
                  passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="btn btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPassword
                ? "Changing Password..."
                : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}