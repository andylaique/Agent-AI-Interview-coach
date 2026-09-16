"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Send,
  Square,
  Volume2,
  Loader2,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  createRecognizer,
  isSpeechSupported,
  speak,
  stopSpeaking,
  isTTSSupported,
} from "@/lib/voice";
import PerformanceOverview from "./PerformanceOverview";

export default function InterviewRoom({ session: initial, onBack }) {
  const [session, setSession] = useState(initial);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [report, setReport] = useState(initial.performance_report || null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const startedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, interim]);

  useEffect(() => {
    if (!voiceEnabled || !isTTSSupported()) return;
    const msgs = session.messages || [];
    const last = msgs[msgs.length - 1];
    if (last?.role === "assistant") {
      speak(last.content);
    }
  }, [session.messages, voiceEnabled]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const startListening = useCallback(() => {
    if (!isSpeechSupported()) {
      alert("Speech recognition is not supported. Use Chrome or Edge.");
      return;
    }
    stopSpeaking();
    const rec = createRecognizer(
      (transcript, isFinal) => {
        if (isFinal) {
          setInput((prev) => (prev ? prev + " " : "") + transcript.trim());
          setInterim("");
        } else {
          setInterim(transcript);
        }
      },
      () => setListening(false)
    );
    if (!rec) return;
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  async function sendMessage(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setInterim("");
    stopListening();
    setLoading(true);

    const tempUser = {
      id: "temp-user",
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setSession((s) => ({
      ...s,
      messages: [...(s.messages || []), tempUser],
      status: "in_progress",
    }));

    try {
      const data = await api.chat(session.id, content);
      setSession((s) => {
        const withoutTemp = (s.messages || []).filter((m) => m.id !== "temp-user");
        return {
          ...s,
          messages: [
            ...withoutTemp,
            { ...tempUser, id: crypto.randomUUID() },
            {
              id: data.message_id || crypto.randomUUID(),
              role: "assistant",
              content: data.reply,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });
    } catch (e) {
      alert(e.message || "Error sending message");
      setSession((s) => ({
        ...s,
        messages: (s.messages || []).filter((m) => m.id !== "temp-user"),
      }));
    } finally {
      setLoading(false);
    }
  }

  async function endInterview() {
    if (ending || (session.messages || []).length < 2) return;
    setEnding(true);
    stopListening();
    stopSpeaking();
    try {
      const data = await api.endInterview(session.id);
      setReport(data.report);
      setSession((s) => ({
        ...s,
        status: "completed",
        performance_report: data.report,
      }));
    } catch (e) {
      alert(e.message || "Could not generate report");
    } finally {
      setEnding(false);
    }
  }

  useEffect(() => {
    if (
      !startedRef.current &&
      (session.messages || []).length === 0 &&
      session.status === "setup"
    ) {
      startedRef.current = true;
      sendMessage(
        `Hi, I'm ready for a ${session.difficulty || "intermediate"} ${session.interview_type} interview for the ${session.job_role} role at ${session.company}. Please start.`
      );
    }
  }, []);

  if (report) {
    return (
      <PerformanceOverview report={report} session={session} onBack={onBack} />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div>
          <h2 className="font-semibold">{session.title}</h2>
          <p className="text-xs text-[var(--muted)]">
            {session.interview_type} · {session.difficulty || "intermediate"} · {session.job_role} @ {session.company}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isTTSSupported() && (
            <button
              onClick={() => {
                setVoiceEnabled((v) => !v);
                if (voiceEnabled) stopSpeaking();
              }}
              className={`p-2 rounded-lg border border-[var(--border)] ${
                voiceEnabled ? "text-[var(--primary)]" : "text-[var(--muted)]"
              }`}
              title="Toggle AI voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={endInterview}
            disabled={ending || (session.messages || []).length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] text-sm font-medium hover:bg-[var(--danger)]/30 disabled:opacity-50"
          >
            {ending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            End & Review
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {session.document_ids?.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-[var(--muted)] bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
            <FileText className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Context loaded from your documents. The coach personalizes
              questions based on your background and the company.
            </span>
          </div>
        )}

        {(session.messages || []).map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--primary)] text-black rounded-br-md"
                  : "bg-[var(--card)] border border-[var(--border)] rounded-bl-md"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {interim && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm text-[var(--muted)] italic border border-dashed border-[var(--border)]">
              {interim}…
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--muted)]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-end gap-2">
          {isSpeechSupported() && (
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              className={`p-3 rounded-xl border transition ${
                listening
                  ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                  : "border-[var(--border)] text-[var(--muted)] hover:text-white"
              }`}
              title={listening ? "Stop listening" : "Speak your answer"}
            >
              {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={2}
            placeholder={
              listening
                ? "Listening… speak naturally (slang is fine)"
                : "Type or speak your answer…"
            }
            className="flex-1 resize-none rounded-xl bg-[var(--card)] border border-[var(--border)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-black disabled:opacity-50 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted)] mt-2 text-center">
          Speak freely — the coach understands natural English & slang. Press End
          when finished for your performance overview.
        </p>
      </div>
    </div>
  );
}
