import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Check, ChevronDown, Edit3, ExternalLink, FileText, GraduationCap, LockKeyhole, Mail, MapPin, Phone, Save, ShieldCheck, Sparkles, Target, Trash2, Upload, UserRound, X, BriefcaseBusiness, Code2 } from "lucide-react";
import Navbar1 from "../components/Navbar1";
import "../styles/profile.css";
const STORAGE_KEY = "aiInterviewRegistration";
const LEGACY_STORAGE_KEY = "pendingRegistration";
const PHOTO_KEY = "aiInterviewProfilePhoto";
const RESUME_KEY = "aiInterviewResume";
const RESUME_DB = "aiInterviewFiles";
const RESUME_STORE = "resumes";
const emptyProfile = {
firstName: "",
lastName: "",
email: "",
phone: "",
status: "",
college: "",
degree: "",
graduationYear: "",
targetRole: "",
experience: "",
interviewFocus: "",
programmingLanguage: "",
terms: false,
};
const statusOptions = [
["student", "Student"],
["graduate", "Graduate"],
["working-professional", "Working Professional"],
["career-switcher", "Career Switcher"],
["other", "Other"],
];
const roleOptions = [
["software-developer", "Software Developer"],
["frontend-developer", "Frontend Developer"],
["backend-developer", "Backend Developer"],
["fullstack-developer", "Full Stack Developer"],
["data-scientist", "Data Scientist"],
["data-analyst", "Data Analyst"],
["ai-ml-engineer", "AI / ML Engineer"],
["cloud-engineer", "Cloud Engineer"],
["devops-engineer", "DevOps Engineer"],
["cybersecurity-engineer", "Cybersecurity Engineer"],
["other", "Other"],
];
const experienceOptions = [
["fresher", "Fresher"],
["0-1", "0–1 years"],
["1-3", "1–3 years"],
["3-5", "3–5 years"],
["5+", "5+ years"],
];
const focusOptions = [
["technical", "Technical"],
["behavioral", "HR / Behavioral"],
["coding", "Coding"],
["ai-ml", "AI / ML"],
["system-design", "System Design"],
["mixed", "Mixed"],
];
const languageOptions = [
["python", "Python"],
["java", "Java"],
["javascript", "JavaScript"],
["typescript", "TypeScript"],
["cpp", "C++"],
["c", "C"],
["csharp", "C#"],
["go", "Go"],
["other", "Other"],
];
const graduationYears = Array.from(
{ length: 12 },
(_, index) => 2025 + index
);
function readJson(key) {
try {
const value = localStorage.getItem(key);
return value ? JSON.parse(value) : null;
} catch {
return null;
}
}
function getInitialProfile() {
const currentUser = readJson("currentUser");
const registration = readJson(STORAGE_KEY);
const legacy = readJson(LEGACY_STORAGE_KEY);
return {
...emptyProfile,
...(currentUser || {}),
...(registration || {}),
...(legacy || {}),
};
}
function getLabel(options, value) {
return (
options.find(([optionValue]) => optionValue === value)?.[1] ||
value ||
"Not provided"
);
}
function openResumeDatabase() {
return new Promise((resolve, reject) => {
const request = indexedDB.open(RESUME_DB, 1);
request.onupgradeneeded = () => {
const database = request.result;
if (!database.objectStoreNames.contains(RESUME_STORE)) {
database.createObjectStore(RESUME_STORE);
}
};
request.onsuccess = () => resolve(request.result);
request.onerror = () => reject(request.error);
});
}
async function saveResumeBlob(file) {
const database = await openResumeDatabase();
return new Promise((resolve, reject) => {
const transaction = database.transaction(
RESUME_STORE,
"readwrite"
);
transaction.objectStore(RESUME_STORE).put(
file,
"currentResume"
);
transaction.oncomplete = () => {
database.close();
resolve();
};
transaction.onerror = () => {
database.close();
reject(transaction.error);
};
});
}
async function loadResumeBlob() {
const database = await openResumeDatabase();
return new Promise((resolve, reject) => {
const transaction = database.transaction(
RESUME_STORE,
"readonly"
);
const request = transaction
.objectStore(RESUME_STORE)
.get("currentResume");
request.onsuccess = () => {
database.close();
resolve(request.result || null);
};
request.onerror = () => {
database.close();
reject(request.error);
};
});
}
async function deleteResumeBlob() {
const database = await openResumeDatabase();
return new Promise((resolve, reject) => {
const transaction = database.transaction(
RESUME_STORE,
"readwrite"
);
transaction.objectStore(RESUME_STORE).delete(
"currentResume"
);
transaction.oncomplete = () => {
database.close();
resolve();
};
transaction.onerror = () => {
database.close();
reject(transaction.error);
};
});
}
export default function Profile() {
const navigate = useNavigate();
const [profile, setProfile] = useState(getInitialProfile);
const [editingSection, setEditingSection] = useState(null);
const [draft, setDraft] = useState(getInitialProfile);
const [photo, setPhoto] =
useState(() =>
localStorage.getItem(PHOTO_KEY) || ""
);
const [resume, setResume] =
useState(() => readJson(RESUME_KEY));
const [resumeUrl, setResumeUrl] =
useState("");
const [message, setMessage] =
useState("");
const [error, setError] =
useState("");
useEffect(() => {
let objectUrl = "";
const loadResume = async () => {
try {
const file = await loadResumeBlob();
if (file) {
objectUrl = URL.createObjectURL(file);
setResumeUrl(objectUrl);
}
} catch {
// IndexedDB may be unavailable in restricted browsers.
}
};
loadResume();
return () => {
if (objectUrl) {
URL.revokeObjectURL(objectUrl);
}
};
}, [resume?.uploadedAt]);
const fullName = useMemo(() => {
const name =
`${profile.firstName} ${profile.lastName}`.trim();
return name || "Your Name";
}, [profile.firstName, profile.lastName]);
const initials = useMemo(() => {
const first =
profile.firstName?.charAt(0) || "U";
const last =
profile.lastName?.charAt(0) || "";
return `${first}${last}`.toUpperCase();
}, [profile.firstName, profile.lastName]);
const beginEdit = (section) => {
setDraft({ ...profile });
setEditingSection(section);
setMessage("");
setError("");
};
const cancelEdit = () => {
setDraft({ ...profile });
setEditingSection(null);
setError("");
};
const updateDraft = (event) => {
const { name, value } = event.target;
setDraft((previous) => ({
...previous,
[name]: value,
}));
};
const saveSection = (section) => {
if (section === "personal") {
if (!draft.firstName.trim()) {
setError("First name is required.");
return;
}
if (!draft.lastName.trim()) {
setError("Last name is required.");
return;
}
if (!draft.phone.trim()) {
setError("Phone number is required.");
return;
}
}
if (section === "education") {
if (!draft.status) {
setError("Please select your current status.");
return;
}
if (!draft.college.trim()) {
setError("College / University is required.");
return;
}
if (!draft.degree.trim()) {
setError("Degree / Program is required.");
return;
}
if (!draft.graduationYear) {
setError("Graduation year is required.");
return;
}
}
if (section === "interview") {
if (!draft.targetRole) {
setError("Please select your target role.");
return;
}
if (!draft.experience) {
setError("Please select your experience level.");
return;
}
if (!draft.interviewFocus) {
setError("Please select your interview focus.");
return;
}
if (!draft.programmingLanguage) {
setError(
"Please select your preferred programming language."
);
return;
}
}
const nextProfile = {
...profile,
...draft,
};
setProfile(nextProfile);
localStorage.setItem(
STORAGE_KEY,
JSON.stringify(nextProfile)
);
localStorage.setItem(
LEGACY_STORAGE_KEY,
JSON.stringify(nextProfile)
);
const currentUser = readJson("currentUser");
if (currentUser) {
localStorage.setItem(
"currentUser",
JSON.stringify({
...currentUser,
...nextProfile,
})
);
}
setEditingSection(null);
setMessage("Profile updated successfully.");
setError("");
};
const handlePhotoChange = (event) => {
const file = event.target.files?.[0];
if (!file) return;
setMessage("");
setError("");
if (!file.type.startsWith("image/")) {
setError("Please choose an image file.");
return;
}
if (file.size > 3 * 1024 * 1024) {
setError("Profile photo must be smaller than 3 MB.");
return;
}
const reader = new FileReader();
reader.onload = () => {
const imageData = reader.result;
localStorage.setItem(
PHOTO_KEY,
imageData
);
setPhoto(imageData);
setMessage("Profile photo updated.");
};
reader.onerror = () => {
setError("Unable to read the selected photo.");
};
reader.readAsDataURL(file);
};
const removePhoto = () => {
localStorage.removeItem(PHOTO_KEY);
setPhoto("");
setMessage("Profile photo removed.");
};
const handleResumeChange = async (event) => {
const file = event.target.files?.[0];
if (!file) return;
setMessage("");
setError("");
const isPdf =
file.type === "application/pdf" ||
file.name.toLowerCase().endsWith(".pdf");
if (!isPdf) {
setError("Please upload your resume in PDF format.");
return;
}
if (file.size > 5 * 1024 * 1024) {
setError("Resume must be smaller than 5 MB.");
return;
}
try {
await saveResumeBlob(file);
const metadata = {
name: file.name,
size: file.size,
type: file.type || "application/pdf",
uploadedAt: new Date().toISOString(),
};
localStorage.setItem(
RESUME_KEY,
JSON.stringify(metadata)
);
setResume(metadata);
const nextUrl = URL.createObjectURL(file);
setResumeUrl((previousUrl) => {
if (previousUrl) {
URL.revokeObjectURL(previousUrl);
}
return nextUrl;
});
setMessage(
"Resume uploaded successfully."
);
} catch {
setError(
"Unable to save the resume in this browser."
);
}
};
const removeResume = async () => {
try {
await deleteResumeBlob();
} catch {
// Continue removing the frontend metadata.
}
localStorage.removeItem(RESUME_KEY);
if (resumeUrl) {
URL.revokeObjectURL(resumeUrl);
}
setResumeUrl("");
setResume(null);
setMessage("Resume removed.");
};
const formatFileSize = (bytes = 0) => {
if (!bytes) return "PDF document";
return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};
const renderEditor = (section) => {
if (editingSection !== section) {
return null;
}
if (section === "personal") {
return (
<div className="profile-edit-form">
<div className="profile-form-grid">
<Field label="First name" name="firstName" value={draft.firstName} onChange={updateDraft} />
<Field label="Last name" name="lastName" value={draft.lastName} onChange={updateDraft} />
<Field label="Phone number" name="phone" value={draft.phone} onChange={updateDraft} type="tel" />
<div className="profile-field">
<label>Email address</label>
<div className="profile-readonly-input">
<Mail size={16} />
<span>{profile.email || "Not provided"}</span>
<LockKeyhole size={14} />
</div>
<small>
Email is kept read-only here because it is
your account identifier.
</small>
</div>
</div>
</div>
);
}
if (section === "education") {
return (
<div className="profile-edit-form">
<div className="profile-form-grid">
<SelectField label="Current status" name="status" value={draft.status} onChange={updateDraft} options={statusOptions} />
<Field label="College / University" name="college" value={draft.college} onChange={updateDraft} />
<Field label="Degree / Program" name="degree" value={draft.degree} onChange={updateDraft} />
<SelectField label="Graduation year" name="graduationYear" value={draft.graduationYear} onChange={updateDraft} options={graduationYears.map((year) => [
String(year),
String(year),
])}
/>
</div>
</div>
);
}
return (
<div className="profile-edit-form">
<div className="profile-form-grid">
<SelectField label="Target role" name="targetRole" value={draft.targetRole} onChange={updateDraft} options={roleOptions} />
<SelectField label="Experience level" name="experience" value={draft.experience} onChange={updateDraft} options={experienceOptions} />
<SelectField label="Primary interview focus" name="interviewFocus" value={draft.interviewFocus} onChange={updateDraft} options={focusOptions} />
<SelectField label="Preferred programming language" name="programmingLanguage" value={draft.programmingLanguage} onChange={updateDraft} options={languageOptions} />
</div>
</div>
);
};
return (
<Navbar1>
<main className="app-content profile-content">
<div className="profile-page">
<header className="profile-page-header">
<div>
<span className="profile-eyebrow">
<span />
YOUR PROFILE
</span>
<h1>Profile & preferences</h1>
<p>
Keep your information updated so AI interviews
can personalize questions and practice sessions
around your goals.
</p>
</div>
<button type="button" className="profile-back-button" onClick={() => navigate("/dashboard")}
>
<ArrowLeft size={16} />
Dashboard
</button>
</header>
{message && (
<div className="profile-message">
<Check size={16} />
{message}
</div>
)}
{error && (
<div className="profile-error">
<X size={16} />
{error}
</div>
)}
{/* =====================================================
PROFILE HERO
===================================================== */}
<section className="profile-hero">
<div className="profile-photo-wrap">
{photo ? (
<img src={photo} alt={`${fullName} profile`} className="profile-photo" />
) : (
<div className="profile-photo profile-photo-placeholder">
{initials}
</div>
)}
<label className="photo-edit-button" title="Change profile photo" >
<Camera size={15} />
<input type="file" accept="image/*" onChange={handlePhotoChange} />
</label>
</div>
<div className="profile-hero-info">
<h2>{fullName}</h2>
<p>
{getLabel(
roleOptions,
profile.targetRole
)}
</p>
<div className="profile-hero-meta">
<span>
<Mail size={14} />
{profile.email || "Email not provided"}
</span>
<span>
<MapPin size={14} />
{profile.college ||
"Education not provided"}
</span>
</div>
</div>
<div className="profile-hero-actions">
{photo && (
<button type="button" className="ghost-danger-button" onClick={removePhoto} >
<Trash2 size={15} />
Remove photo
</button>
)}
<label className="profile-photo-button">
<Camera size={15} />
Change photo
<input type="file" accept="image/*" onChange={handlePhotoChange} />
</label>
</div>
</section>
{/* =====================================================
PERSONAL INFORMATION
===================================================== */}
<section className="profile-section-card">
<SectionHeader icon={UserRound} eyebrow="ACCOUNT" title="Personal information" description="Your basic contact and identity information." editing={editingSection === "personal"} onEdit={() => beginEdit("personal")}
onCancel={cancelEdit}
onSave={() => saveSection("personal")}
/>
{editingSection === "personal" ? (
renderEditor("personal")
) : (
<div className="profile-info-grid">
<InfoItem label="First name" value={profile.firstName} />
<InfoItem label="Last name" value={profile.lastName} />
<InfoItem label="Email address" value={profile.email} icon={Mail} locked />
<InfoItem label="Phone number" value={profile.phone} icon={Phone} />
</div>
)}
</section>
{/* =====================================================
EDUCATION
===================================================== */}
<section className="profile-section-card">
<SectionHeader icon={GraduationCap} eyebrow="EDUCATION & BACKGROUND" title="Education & background" description="Your academic background and current professional status." editing={editingSection === "education"} onEdit={() => beginEdit("education")}
onCancel={cancelEdit}
onSave={() => saveSection("education")}
/>
{editingSection === "education" ? (
renderEditor("education")
) : (
<div className="profile-info-grid">
<InfoItem label="Current status" value={getLabel( statusOptions, profile.status )} />
<InfoItem label="College / University" value={profile.college} />
<InfoItem label="Degree / Program" value={profile.degree} />
<InfoItem label="Graduation year" value={profile.graduationYear} />
</div>
)}
</section>
{/* =====================================================
INTERVIEW PROFILE
===================================================== */}
<section className="profile-section-card">
<SectionHeader icon={Target} eyebrow="INTERVIEW PROFILE" title="Interview preferences" description="These preferences personalize your future AI interview sessions." editing={editingSection === "interview"} onEdit={() => beginEdit("interview")}
onCancel={cancelEdit}
onSave={() => saveSection("interview")}
/>
{editingSection === "interview" ? (
renderEditor("interview")
) : (
<div className="profile-info-grid">
<InfoItem label="Target role" value={getLabel( roleOptions, profile.targetRole )} icon={BriefcaseBusiness} />
<InfoItem label="Experience level" value={getLabel( experienceOptions, profile.experience )} />
<InfoItem label="Primary interview focus" value={getLabel( focusOptions, profile.interviewFocus )} icon={Target} />
<InfoItem label="Preferred programming language" value={getLabel( languageOptions, profile.programmingLanguage )} icon={Code2} />
</div>
)}
</section>
{/* =====================================================
RESUME
===================================================== */}
<section className="profile-section-card resume-profile-card">
<div className="profile-section-header">
<div className="profile-section-title-wrap">
<div className="profile-section-icon">
<FileText size={19} />
</div>
<div>
<span className="profile-section-eyebrow">
RESUME
</span>
<h2>Resume document</h2>
<p>
Your PDF is used for resume-based interviews
and future AI analysis.
</p>
</div>
</div>
<label className="resume-upload-button">
<Upload size={15} />
{resume ? "Replace resume" : "Upload resume"}
<input type="file" accept="application/pdf,.pdf" onChange={handleResumeChange} />
</label>
</div>
{resume ? (
<div className="resume-profile-file">
<div className="resume-file-icon-large">
<FileText size={25} />
</div>
<div className="resume-file-details">
<strong>{resume.name}</strong>
<span>
PDF · {formatFileSize(resume.size)}
{" · "}
Uploaded{" "}
{new Date(
resume.uploadedAt
).toLocaleDateString()}
</span>
</div>
<div className="resume-file-actions">
{resumeUrl && (
<a href={resumeUrl} target="_blank" rel="noreferrer" className="resume-action secondary" >
<ExternalLink size={15} />
View
</a>
)}
<label className="resume-action primary">
<Upload size={15} />
Replace
<input type="file" accept="application/pdf,.pdf" onChange={handleResumeChange} />
</label>
<button type="button" className="resume-action danger" onClick={removeResume} >
<Trash2 size={15} />
Delete
</button>
</div>
</div>
) : (
<label className="resume-empty-state">
<div className="resume-empty-icon">
<FileText size={25} />
</div>
<div>
<strong>
No resume uploaded yet
</strong>
<span>
Upload one PDF file, up to 5 MB.
</span>
</div>
<Upload size={18} />
<input type="file" accept="application/pdf,.pdf" onChange={handleResumeChange} />
</label>
)}
</section>
{/* =====================================================
SECURITY / AGREEMENT
===================================================== */}
<section className="profile-security-grid">
<article className="profile-security-card">
<div className="security-icon">
<ShieldCheck size={19} />
</div>
<div>
<span className="profile-section-eyebrow">
ACCOUNT SECURITY
</span>
<h3>Password & authentication</h3>
<p>
Your password is intentionally not shown or
stored in this frontend profile page.
</p>
</div>
<button type="button" className="security-button" onClick={() => navigate("/settings")}
>
Manage security
<ExternalLink size={14} />
</button>
</article>
<article className="profile-security-card">
<div className="security-icon green">
<Check size={19} />
</div>
<div>
<span className="profile-section-eyebrow">
AGREEMENT
</span>
<h3>Terms & Privacy</h3>
<p>
{profile.terms
? "Terms of Service and Privacy Policy accepted during registration."
: "Agreement status is not available."}
</p>
</div>
<span className="agreement-badge">
{profile.terms ? "Accepted" : "Pending"}
</span>
</article>
</section>
<footer className="profile-footer">
<span>
<Sparkles size={13} />
Your profile powers personalized AI interview practice.
</span>
<span>
Profile changes are currently saved locally.
</span>
</footer>
</div>
</main>
</Navbar1>
);
}
function SectionHeader({
icon: Icon,
eyebrow,
title,
description,
editing,
onEdit,
onCancel,
onSave,
}) {
return (
<div className="profile-section-header">
<div className="profile-section-title-wrap">
<div className="profile-section-icon">
<Icon size={19} />
</div>
<div>
<span className="profile-section-eyebrow">
{eyebrow}
</span>
<h2>{title}</h2>
<p>{description}</p>
</div>
</div>
{editing ? (
<div className="profile-edit-actions">
<button type="button" className="profile-cancel-button" onClick={onCancel} >
<X size={15} />
Cancel
</button>
<button type="button" className="profile-save-button" onClick={onSave} >
<Save size={15} />
Save changes
</button>
</div>
) : (
<button type="button" className="profile-edit-button" onClick={onEdit} >
<Edit3 size={15} />
Edit
</button>
)}
</div>
);
}
function InfoItem({
label,
value,
icon: Icon,
locked = false,
}) {
return (
<div className="profile-info-item">
<span className="profile-info-label">
{label}
{locked && (
<LockKeyhole size={12} />
)}
</span>
<div className="profile-info-value">
{Icon && <Icon size={15} />}
<span>
{value || "Not provided"}
</span>
</div>
</div>
);
}
function Field({
label,
name,
value,
onChange,
type = "text",
}) {
return (
<div className="profile-field">
<label htmlFor={name}>{label}</label>
<input id={name} name={name} type={type} value={value || ""} onChange={onChange} />
</div>
);
}
function SelectField({
label,
name,
value,
onChange,
options,
}) {
return (
<div className="profile-field">
<label htmlFor={name}>{label}</label>
<div className="profile-select-wrap">
<select id={name} name={name} value={value || ""} onChange={onChange} >
<option value="">
Select {label.toLowerCase()}
</option>
{options.map(([optionValue, optionLabel]) => (
<option key={optionValue} value={optionValue} >
{optionLabel}
</option>
))}
</select>
<ChevronDown size={16} />
</div>
</div>
);
}
