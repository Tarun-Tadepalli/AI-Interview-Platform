import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Upload,
  X,
} from "lucide-react";

import "../styles/auth.css";

import Navbar from "../components/Navbar";

export default function ResumeSetup() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");


  /* =========================================================
     FILE SELECTION
  ========================================================= */

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");

    if (!selectedFile) {
      return;
    }


    /* PDF ONLY */

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);

      setError(
        "Please upload your resume in PDF format."
      );

      return;
    }


    /* MAXIMUM 5 MB */

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);

      setError(
        "Resume must be smaller than 5 MB."
      );

      return;
    }


    setFile(selectedFile);
  };


  /* =========================================================
     REMOVE SELECTED FILE
  ========================================================= */

  const removeFile = () => {
    setFile(null);
    setError("");
  };


  /* =========================================================
     CONTINUE
  ========================================================= */

  const handleContinue = () => {

    if (!file) {

      setError(
        "Please upload your resume before continuing."
      );

      return;
    }


    /*
      TEMPORARY FRONTEND-ONLY STORAGE

      IMPORTANT:

      localStorage cannot permanently store a File object.

      For now we store resume metadata only.

      Later backend will replace this with:

      POST /resume/upload

      Backend flow:

      1. Receive PDF
      2. Validate file
      3. Store resume
      4. Extract PDF text
      5. Parse resume information
      6. Save structured information
      7. Associate resume with user
      8. Make resume available to:
         - Interview Practice
         - Dashboard
         - Profile
         - Progress
         - AI question generation
    */

    localStorage.setItem(
      "aiInterviewResume",
      JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      })
    );


    /*
      Registration information already stored
      by Register.jsx will remain available
      until backend authentication is connected.
    */

    navigate("/login");
  };


  return (
    <div className="auth-page resume-page">
      <Navbar showHome={false} />


      {/* =====================================================
          RESUME CONTENT
      ===================================================== */}

      <main className="auth-main">

        <section className="auth-form-panel">

          <div className="auth-form-container">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="resume-header">

              <div className="auth-small-label">

                <FileText size={14} />

                Complete your profile

              </div>


              <h1>
                Upload your resume.
              </h1>


              <p>
                Your resume will be used to personalize
                interview questions, identify your skills
                and prepare relevant practice sessions.
              </p>

            </div>


            {/* =================================================
                UPLOAD AREA
            ================================================= */}

            <div className="resume-upload-box">

              <div className="resume-upload-icon">

                <Upload size={24} />

              </div>


              <h3>

                {file
                  ? "Resume selected"
                  : "Choose your resume PDF"}

              </h3>


              <p>
                PDF format only · Maximum size 5 MB
              </p>


              {!file && (
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="resume-file-input"
                  onChange={handleFileChange}
                />
              )}

            </div>


            {/* =================================================
                SELECTED FILE
            ================================================= */}

            {file && (

              <div className="resume-selected-file">

                <div>

                  <FileText size={16} />

                  <span>
                    {file.name}
                  </span>

                </div>


                <button
                  type="button"
                  onClick={removeFile}
                  aria-label="Remove resume"
                  title="Remove resume"
                >

                  <X size={16} />

                </button>

              </div>

            )}


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

              <div className="auth-error">

                {error}

              </div>

            )}


            {/* =================================================
                CONTINUE
            ================================================= */}

            <button
              type="button"
              className="auth-submit"
              onClick={handleContinue}
            >

              Continue to Login

              <ArrowRight size={18} />

            </button>


            {/* =================================================
                SECURITY
            ================================================= */}

            <div className="secure-note">

              <CheckCircle2 size={15} />

              <span>
                Your resume will be securely associated
                with your interview profile.
              </span>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}