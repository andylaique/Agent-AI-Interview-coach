"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Upload,
  LogOut,
  FileText,
  Loader2,
  Briefcase,
} from "lucide-react";
import { api } from "@/lib/api";
import InterviewRoom from "./InterviewRoom";

const CURRICULUM_OPTIONS = [
  { value: "frontend", label: "Frontend Development" },
  { value: "backend", label: "Backend Development" },
  { value: "data_ml", label: "Data & Machine Learning" },
  { value: "iot", label: "Internet of Things (IoT)" },
  { value: "mobile", label: "Mobile Development" },
  { value: "product_management", label: "Product Management" },
  { value: "qa", label: "Quality Assurance (QA)" },
  { value: "cyber_security", label: "Cyber Security" },
  { value: "product_design", label: "Product Design" },
  { value: "ux_research", label: "UX Research" },
];

export default function Dashboard({ user, onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  const [title, setTitle] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [company, setCompany] = useState("");
  const [interviewType, setInterviewType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [useCurriculum, setUseCurriculum] = useState(false);
  const [curriculumTrack, setCurriculumTrack] = useState("frontend");
  const fileRef = useRef(null);

  async function loadSessions() {
    try {
      const list = await api.listSessions();
      setSessions(list || []);
    } catch {

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.uploadDocument(file);
      setUploadedDocs((prev) => [...prev, data.document]);
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function createInterview() {
    if (!jobRole.trim() || !company.trim()) {
      alert("Please fill in job role and company");
      return;
    }
    if (useCurriculum && !curriculumTrack) {
      alert("Please pick a codeHive track");
      return;
    }
    setCreating(true);
    try {
      const session = await api.createSession({
        title: title || `${jobRole} at ${company}`,
        job_role: jobRole,
        company,
        interview_type: interviewType,
        difficulty,
        use_curriculum: useCurriculum,
        curriculum_track: useCurriculum ? curriculumTrack : "",
        document_ids: uploadedDocs.map((d) => d.id),
      });
      setActiveSession(session);
      setShowNew(false);
      setTitle("");
      setJobRole("");
      setCompany("");
      setUploadedDocs([]);
      setUseCurriculum(false);
      setDifficulty("intermediate");
      loadSessions();
    } catch (err) {
      alert(err.message || "Failed");
    } finally {
      setCreating(false);
    }
  }

  async function openSession(id) {
    try {
      const session = await api.getSession(id);
      setActiveSession(session);
    } catch (err) {
      alert(err.message);
    }
  }

  if (activeSession) {
    return (
      <InterviewRoom
        session={activeSession}
        onBack={() => {
          setActiveSession(null);
          loadSessions();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold">
            Hey, {user.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            Ready to practice your next interview?
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      {!showNew ? (
        <button
          onClick={() => setShowNew(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] py-10 text-[var(--muted)] hover:text-white transition mb-10"
        >
          <Plus className="w-5 h-5" />
          Start a new mock interview
        </button>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-10 space-y-5">
          <h2 className="font-semibold text-lg">New Interview Setup</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1.5">
                Job role *
              </label>
              <input
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Quality Assurance Analyst"
                className="w-full rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1.5">
                Company *
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Zipline"
                className="w-full rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1.5">
              Session title (optional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Zipline QA practice"
              className="w-full rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1.5">
              Interview type
            </label>
            <div className="flex flex-wrap gap-2">
              {["behavioral", "technical", "mixed", "case"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInterviewType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize border transition ${
                    interviewType === t
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                      : "border-[var(--border)] text-[var(--muted)] hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1.5">
              Difficulty level
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ].map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    difficulty === d.value
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                      : "border-[var(--border)] text-[var(--muted)] hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)] mt-1.5">
              Beginner = simple basics · Intermediate = realistic job questions ·
              Advanced = harder, deeper questions
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useCurriculum}
                onChange={(e) => setUseCurriculum(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)]"
              />
              <span className="text-sm font-medium">
                Base questions on the codeHive 2026 curriculum
              </span>
            </label>
            <p className="text-xs text-[var(--muted)]">
              Optional. Turn this on if you want questions linked to what you are
              learning in codeHive.
            </p>
            {useCurriculum && (
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">
                  codeHive track
                </label>
                <select
                  value={curriculumTrack}
                  onChange={(e) => setCurriculumTrack(e.target.value)}
                  className="w-full rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {CURRICULUM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1.5">
              Upload resume / company notes / job description (PDF, DOCX, TXT)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:border-[var(--primary)] transition disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload document
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
            {uploadedDocs.length > 0 && (
              <ul className="mt-3 space-y-2">
                {uploadedDocs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-start gap-2 text-sm bg-[var(--background)] rounded-lg p-3 border border-[var(--border)]"
                  >
                    <FileText className="w-4 h-4 mt-0.5 text-[var(--primary)] shrink-0" />
                    <div>
                      <p className="font-medium">{d.filename}</p>
                      <p className="text-[var(--muted)] text-xs mt-0.5 line-clamp-2">
                        {d.preview}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={createInterview}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black font-medium text-sm disabled:opacity-60"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Start interview
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2.5 rounded-lg text-sm text-[var(--muted)] hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Your sessions
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--muted)]" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-[var(--muted)] text-sm text-center py-8">
            No interviews yet. Start one above.
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s.id)}
                className="w-full text-left flex items-center justify-between bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--border)] rounded-xl px-5 py-4 transition"
              >
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {s.interview_type}
                    {s.difficulty ? ` · ${s.difficulty}` : ""} ·{" "}
                    {new Date(s.created_at).toLocaleDateString()} · {s.status}
                  </p>
                </div>
                {s.overall_score != null && (
                  <span
                    className={`text-lg font-bold ${
                      s.overall_score >= 80
                        ? "text-[var(--success)]"
                        : s.overall_score >= 60
                        ? "text-[var(--warning)]"
                        : "text-[var(--danger)]"
                    }`}
                  >
                    {s.overall_score}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
