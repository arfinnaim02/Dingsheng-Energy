import {
  ContactForm,
} from "@/components/contact/ContactForm";

import {
  PageHero,
} from "@/components/PageHero";

import {
  PublicShell,
} from "@/components/PublicShell";

import {
  company,
} from "@/data/site";

export const metadata = {
  title: "Contact & RFQ",
};

export default function ContactPage() {
  return (
    <PublicShell>
      <PageHero
        eyebrow="Get in touch"
        title="Contact Dingsheng Energy"
        description="Contact our team for product supply, LPG trading, engineering services, project requirements or dealer access."
        image="/media/hero-contact.jpg"
        imageAlt="Dingsheng Energy LPG engineering and customer support team"
        imagePosition="right"
      />

      <section
        id="rfq"
        className="section"
      >
        <div className="container-shell grid gap-9 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <div className="eyebrow">
              Contact information
            </div>

            <h2 className="h2 mt-3">
              Talk with our team
            </h2>

            <div className="card mt-7 p-7 text-sm leading-7">
              <strong>
                Dingsheng Energy Limited
                Headquarter
              </strong>

              <p className="mt-3 text-[#657983]">
                {company.address}
              </p>

              <p className="mt-5">
                <strong>Phone</strong>
                <br />
                {company.phone}
              </p>

              <p className="mt-4">
                <strong>Email</strong>
                <br />
                {company.email}
              </p>

              <p className="mt-4">
                <strong>Website</strong>
                <br />
                {company.website}
              </p>
            </div>
          </div>

          <div className="card p-7 md:p-9">
            <div className="eyebrow">
              Request a quote
            </div>

            <h2 className="mt-2 text-3xl font-extrabold">
              Tell us what you need
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#657983]">
              Use this form for product,
              project, service or trading
              requirements. Our team will
              review your request and follow
              up using the contact details
              provided.
            </p>

            <ContactForm />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}