import React from "react";
import { ShieldCheck, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar1 from "../components/Navbar1";
import "../styles/privacy.css";

const sections = [
  {
    id: "information",
    title: "1. Information We Collect",
    content: (
      <>
        <p>
          We collect information that you provide when creating and using an
          AI Interview Platform account.
        </p>
        <ul>
          <li>Basic profile information such as your name and contact details.</li>
          <li>Education and career information you choose to provide.</li>
          <li>Interview preferences and practice information.</li>
          <li>Resume files and related information you upload.</li>
          <li>Information generated through your use of platform features.</li>
        </ul>
      </>
    ),
  },
  {
    id: "usage",
    title: "2. How We Use Information",
    content: (
      <>
        <p>Information may be used to:</p>
        <ul>
          <li>Create and maintain your account.</li>
          <li>Provide interview preparation and practice features.</li>
          <li>Personalize interview questions and recommendations.</li>
          <li>Process resumes for resume-based interview preparation.</li>
          <li>Provide AI-generated questions, feedback, and explanations.</li>
          <li>Maintain platform security and prevent misuse.</li>
          <li>Improve reliability and functionality of the service.</li>
        </ul>
      </>
    ),
  },
  {
    id: "resume",
    title: "3. Resume and Profile Information",
    content: (
      <>
        <p>
          If you upload a resume or provide profile information, that
          information may be processed to provide features such as
          resume-based interviews, personalized questions, progress tracking,
          and AI-assisted preparation.
        </p>
        <p>
          You should avoid uploading information that you do not have the right
          to provide or that is unnecessary for your intended use of the
          platform.
        </p>
      </>
    ),
  },
  {
    id: "ai-processing",
    title: "4. AI and Automated Processing",
    content: (
      <>
        <p>
          Some platform features may use large language models and other
          artificial intelligence technologies to process information and
          generate responses.
        </p>
        <p>
          Depending on the feature and technical architecture, relevant
          information may be sent to an AI service provider for processing.
          The platform should only send information reasonably necessary for
          the requested feature.
        </p>
        <p>
          AI-generated results may not always be accurate. Automated processing
          is intended to support your preparation experience and should not be
          treated as a guaranteed assessment of your abilities.
        </p>
      </>
    ),
  },
  {
    id: "storage",
    title: "5. Data Storage and Security",
    content: (
      <>
        <p>
          We take reasonable technical and organizational measures to protect
          account and platform information from unauthorized access, misuse,
          alteration, or loss.
        </p>
        <p>
          No method of storing or transmitting information over the internet
          can be guaranteed to be completely secure. Security practices may
          evolve as the platform architecture develops.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "6. When Information May Be Shared",
    content: (
      <>
        <p>
          We do not intend to sell personal information as a source of
          advertising revenue.
        </p>
        <p>
          Information may be processed or shared with service providers when
          necessary to operate requested platform functionality, such as
          hosting, storage, authentication, AI processing, or other technical
          services.
        </p>
        <p>
          Information may also be disclosed when required by applicable law,
          legal process, or to protect the security and rights of users and the
          platform.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "7. Cookies and Local Storage",
    content: (
      <>
        <p>
          The application may use browser storage technologies such as local
          storage, IndexedDB, cookies, or similar mechanisms to maintain
          application state, preferences, authentication-related information,
          and other functionality.
        </p>
        <p>
          The exact technologies used may change as the platform architecture
          evolves.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "8. Data Retention",
    content: (
      <>
        <p>
          Information may be retained for as long as reasonably necessary to
          provide requested services, maintain account functionality, comply
          with legal obligations, resolve disputes, and protect the platform.
        </p>
        <p>
          Retention periods may differ depending on the type of information and
          the purpose for which it is processed.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "9. Your Choices and Rights",
    content: (
      <>
        <p>
          Depending on applicable law, you may have rights relating to your
          personal information, including rights to access, correct, delete,
          or otherwise control certain information.
        </p>
        <p>
          Account settings and profile controls may allow you to update or
          remove certain information directly. Additional requests may require
          account verification.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "10. Children's Privacy",
    content: (
      <>
        <p>
          The platform is intended for users who are legally permitted to use
          the service under applicable laws. We do not knowingly design the
          service to collect personal information from children in violation of
          applicable privacy requirements.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "11. Third-Party Services",
    content: (
      <>
        <p>
          The platform may rely on third-party infrastructure and services.
          Those providers may process information according to their own
          privacy policies and contractual obligations.
        </p>
        <p>
          Users should review the policies of relevant third-party services
          where appropriate.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "12. Changes to This Privacy Policy",
    content: (
      <>
        <p>
          This Privacy Policy may be updated when the platform's functionality,
          data practices, technology, or legal requirements change.
        </p>
        <p>
          The latest version will be published on this page together with a
          revised effective date.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "13. Contact",
    content: (
      <>
        <p>
          If you have questions about this Privacy Policy or how information is
          handled, please use the official contact method provided by the
          platform.
        </p>
      </>
    ),
  },
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <Navbar1>
      <main className="app-content privacy-content">
        <div className="privacy-page">

          <header className="privacy-header">
            <button className="privacy-back-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="privacy-title-row">
              <div className="privacy-title-icon">
                <ShieldCheck size={25} />
              </div>

              <div>
                <span className="privacy-eyebrow">LEGAL DOCUMENT</span>
                <h1>Privacy Policy</h1>
                <p>
                  How AI Interview Platform handles information used by the service.
                </p>
              </div>
            </div>

            <div className="privacy-meta">
              <span>Effective Date: September 12, 2026</span>
              <span>Last Updated: September 12, 2026</span>
            </div>
          </header>

          <div className="privacy-layout">

            <aside className="privacy-sidebar">
              <div className="privacy-sidebar-title">On this page</div>

              <nav>
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`}>
                    {section.title.replace(/^\d+\.\s/, "")}
                    <ChevronRight size={14} />
                  </a>
                ))}
              </nav>

              <button onClick={() => navigate("/terms")}>
                Terms & Conditions
                <ChevronRight size={15} />
              </button>
            </aside>

            <article className="privacy-document">

              <div className="privacy-introduction">
                <strong>Your privacy matters.</strong>
                <p>
                  This Privacy Policy explains the categories of information
                  that may be collected, how that information may be used, and
                  the choices available to users of AI Interview Platform.
                </p>
              </div>

              {sections.map((section) => (
                <section className="privacy-section" id={section.id} key={section.id}>
                  <h2>{section.title}</h2>
                  {section.content}
                </section>
              ))}

              <div className="privacy-document-footer">
                <span>AI Interview Training Platform</span>
                <span>Privacy Policy</span>
              </div>

            </article>

          </div>
        </div>
      </main>
    </Navbar1>
  );
}