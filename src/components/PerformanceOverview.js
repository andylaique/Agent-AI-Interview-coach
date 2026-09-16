"use client";

import { ArrowLeft, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";

function ScoreBar({ score, label }) {
  const color =
    score >= 80
      ? "bg-[var(--success)]"
      : score >= 60
      ? "bg-[var(--warning)]"
      : "bg-[var(--danger)]";
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

export default function PerformanceOverview({ report, session, onBack }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </button>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Performance Overview</h1>
        <p className="text-[var(--muted)]">
          {session.title} · {session.interview_type} interview
        </p>
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-[var(--primary)] mt-4">
          <span className="text-4xl font-bold">{report.overall_score}</span>
        </div>
        <p className="text-sm text-[var(--muted)]">Overall Score</p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Category Breakdown</h2>
        {(report.categories || []).map((c) => (
          <ScoreBar key={c.name} score={c.score} label={c.name} />
        ))}
        {(report.categories || []).map(
          (c) =>
            c.feedback && (
              <p key={c.name + "-fb"} className="text-sm text-[var(--muted)]">
                <span className="font-medium text-white">{c.name}:</span>{" "}
                {c.feedback}
              </p>
            )
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-[var(--success)]">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-semibold">Strengths</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {(report.strengths || []).map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--success)]">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-[var(--warning)]">
            <AlertCircle className="w-5 h-5" />
            <h3 className="font-semibold">Areas to Improve</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {(report.areas_for_improvement || []).map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--warning)]">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(report.key_moments || []).length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Key Moments</h2>
          {report.key_moments.map((m, i) => (
            <div
              key={i}
              className="border-l-2 border-[var(--primary)] pl-4 space-y-1"
            >
              <p className="text-sm font-medium">Q: {m.question}</p>
              <p className="text-sm text-[var(--muted)]">
                Your answer: {m.answer_summary}
              </p>
              <p className="text-sm text-[var(--primary-hover)]">{m.feedback}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3 text-[var(--primary)]">
          <Lightbulb className="w-5 h-5" />
          <h3 className="font-semibold">Actionable Tips</h3>
        </div>
        <ul className="space-y-2 text-sm">
          {(report.actionable_tips || []).map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--primary)] font-medium">{i + 1}.</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="font-semibold mb-2">Summary</h3>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          {report.summary}
        </p>
      </div>
    </div>
  );
}