import React from "react";
import { FileText, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar1 from "../components/Navbar1";
import "../styles/terms.css";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <>
        <p>
          Welcome to AI Interview Platform. By creating an account, accessing
          the platform, or using any of its features, you agree to comply with
          these Terms & Conditions and any applicable laws and regulations.
        </p>
        <p>
          If you do not agree with these terms, you should not create an account
          or use the platform.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "2. About the Service",
    content: (
      <>
        <p>
          AI Interview Platform is an interview preparation and practice
          application designed to help users prepare for technical,
          behavioral, coding, speaking, and other interview-related activities.
        </p>
        <p>
          The platform may provide AI-generated interview questions, feedback,
          explanations, recommendations, practice exercises, and other
          educational assistance.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "3. User Accounts",
    content: (
      <>
        <p>
          Some features require you to create an account. You are responsible
          for providing accurate information and keeping your account
          credentials secure.
        </p>
        <p>
          You should not share your password or knowingly allow another person
          to access your account. You are responsible for activity performed
          through your account until unauthorized access is reported.
        </p>
        <p>
          We may introduce additional account verification and security
          requirements as the platform develops.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable Use",
    content: (
      <>
        <p>You agree to use the platform only for lawful purposes.</p>
        <ul>
          <li>Do not use the platform to violate applicable laws.</li>
          <li>Do not attempt to gain unauthorized access to the platform.</li>
          <li>Do not interfere with or disrupt platform functionality.</li>
          <li>Do not upload malicious files, code, or harmful content.</li>
          <li>Do not misuse automated systems or AI features.</li>
          <li>Do not impersonate another person or misrepresent your identity.</li>
        </ul>
      </>
    ),
  },
  {
    id: "resume",
    title: "5. Resume and User Content",
    content: (
      <>
        <p>
          You may upload resumes and provide profile information for use within
          the interview preparation experience.
        </p>
        <p>
          You are responsible for ensuring that content you upload is accurate,
          lawful, and does not knowingly infringe another person's rights.
        </p>
        <p>
          You retain ownership of the personal content you provide. You grant
          the platform permission to process that content as necessary to
          provide the requested features, including resume-based interview
          preparation and AI-assisted functionality.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "6. AI-Generated Content",
    content: (
      <>
        <p>
          AI Interview Platform may use artificial intelligence and large
          language model technologies to generate questions, explanations,
          evaluations, recommendations, and other responses.
        </p>
        <p>
          AI-generated information may contain mistakes, omissions, or
          inaccurate conclusions. AI output should therefore be treated as
          educational assistance rather than guaranteed professional,
          employment, legal, financial, or technical advice.
        </p>
        <p>
          Users should review important information independently and use their
          own judgment when making decisions based on AI-generated content.
        </p>
      </>
    ),
  },
  {
    id: "educational",
    title: "7. Educational Purpose",
    content: (
      <>
        <p>
          The platform is intended to support interview preparation and
          learning. Scores, evaluations, readiness indicators, and AI feedback
          are estimates intended to help users identify areas for improvement.
        </p>
        <p>
          They do not guarantee interview performance, employment, selection,
          promotion, or any particular career outcome.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "8. Intellectual Property",
    content: (
      <>
        <p>
          The platform's software, interface, branding, visual design,
          documentation, and original platform content may be protected by
          applicable intellectual property laws.
        </p>
        <p>
          Except where expressly permitted, you may not copy, reproduce,
          modify, distribute, sell, reverse engineer, or commercially exploit
          platform components without appropriate authorization.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "9. Service Availability",
    content: (
      <>
        <p>
          We aim to keep the platform available and reliable, but we do not
          guarantee uninterrupted or error-free operation.
        </p>
        <p>
          Features may occasionally be unavailable because of maintenance,
          technical problems, security events, infrastructure limitations, or
          changes to third-party services.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "10. Third-Party Services",
    content: (
      <>
        <p>
          Certain platform functionality may depend on third-party services,
          including AI, hosting, authentication, storage, analytics, or other
          infrastructure providers.
        </p>
        <p>
          Third-party services may have their own terms, policies, limitations,
          and availability requirements.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "11. Account Suspension or Termination",
    content: (
      <>
        <p>
          We may restrict, suspend, or terminate access to an account where
          necessary to protect the platform, users, comply with applicable law,
          investigate abuse, or address violations of these terms.
        </p>
        <p>
          Users may also choose to stop using the platform or request account
          deletion through the available account controls.
        </p>
      </>
    ),
  },
  {
    id: "disclaimer",
    title: "12. Disclaimer",
    content: (
      <>
        <p>
          The platform is provided on an as-available basis. To the extent
          permitted by applicable law, we do not guarantee that the platform,
          its AI-generated content, or its results will always be accurate,
          complete, reliable, secure, or suitable for every individual purpose.
        </p>
      </>
    ),
  },
  {
    id: "limitation",
    title: "13. Limitation of Liability",
    content: (
      <>
        <p>
          To the maximum extent permitted by applicable law, the platform and
          its operators will not be responsible for indirect, incidental,
          special, consequential, or similar losses arising from the use of the
          platform or reliance on its content.
        </p>
        <p>
          Nothing in these terms is intended to exclude or limit liability
          where such exclusion or limitation is prohibited by law.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "14. Changes to These Terms",
    content: (
      <>
        <p>
          These Terms & Conditions may be updated as the platform, its
          functionality, or applicable requirements change.
        </p>
        <p>
          When significant changes are made, the updated version will be
          published on this page with a revised effective date.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "15. Contact",
    content: (
      <>
        <p>
          If you have questions regarding these Terms & Conditions, please use
          the official contact method provided by the platform.
        </p>
      </>
    ),
  },
];

export default function Terms() {
  const navigate = useNavigate();

  return (
    <Navbar1>
      <main className="app-content legal-content">
        <div className="legal-page">

          <header className="legal-header">
            <button className="legal-back-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="legal-title-row">
              <div className="legal-title-icon">
                <FileText size={25} />
              </div>

              <div>
                <span className="legal-eyebrow">LEGAL DOCUMENT</span>
                <h1>Terms & Conditions</h1>
                <p>
                  The terms that govern your use of AI Interview Platform.
                </p>
              </div>
            </div>

            <div className="legal-meta">
              <span>Effective Date: September 12, 2026</span>
              <span>Last Updated: September 12, 2026</span>
            </div>
          </header>

          <div className="legal-layout">

            <aside className="legal-sidebar">
              <div className="legal-sidebar-title">On this page</div>

              <nav>
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`}>
                    {section.title.replace(/^\d+\.\s/, "")}
                    <ChevronRight size={14} />
                  </a>
                ))}
              </nav>

              <button onClick={() => navigate("/privacy")}>
                Privacy Policy
                <ChevronRight size={15} />
              </button>
            </aside>

            <article className="legal-document">
              <div className="legal-introduction">
                <strong>Please read these terms carefully.</strong>
                <p>
                  These Terms & Conditions describe the rules and conditions
                  applicable to your use of AI Interview Platform. They are
                  designed to provide a clear understanding of your rights and
                  responsibilities when using the service.
                </p>
              </div>

              {sections.map((section) => (
                <section className="legal-section" id={section.id} key={section.id}>
                  <h2>{section.title}</h2>
                  {section.content}
                </section>
              ))}

              <div className="legal-document-footer">
                <span>AI Interview Training Platform</span>
                <span>Terms & Conditions</span>
              </div>
            </article>

          </div>
        </div>
      </main>
    </Navbar1>
  );
}