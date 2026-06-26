"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/LocaleProvider";
import { api } from "@/lib/api";

export function MicCapture() {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const supportsSpeech = useRef(false);

  useEffect(() => {
    const SR =
      (typeof window !== "undefined" && (window as any).SpeechRecognition) ||
      (typeof window !== "undefined" && (window as any).webkitSpeechRecognition);
    supportsSpeech.current = !!SR;
  }, []);

  function startRec() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setToast("Speech recognition not supported in this browser — type instead.");
      return;
    }
    const rec = new SR();
    rec.lang = locale === "ar" ? "ar-SA" : "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e: any) => {
      let finalT = "";
      for (let i = 0; i < e.results.length; i++) finalT += e.results[i][0].transcript;
      setText(finalT);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }

  function stopRec() {
    recRef.current?.stop?.();
    setRecording(false);
  }

  function openSheet() {
    setText("");
    setToast(null);
    setOpen(true);
  }

  function closeSheet() {
    stopRec();
    setOpen(false);
  }

  async function send() {
    const transcript = text.trim();
    if (!transcript) return;
    setSending(true);
    stopRec();
    try {
      const res = await api.post<any>("/api/capture", { transcript, source: "in_app" });
      setToast(res.spoken_confirmation || (res.summary?.join(" · ") ?? "Captured."));
      setOpen(false);
      setText("");
      // Let other screens know to refresh
      window.dispatchEvent(new CustomEvent("pod:captured"));
    } catch (e: any) {
      setToast(`Error: ${e.message}`);
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 4500);
    }
  }

  return (
    <>
      {!open && (
        <button className="fab" onClick={openSheet} aria-label={t("capture")}>
          🎙️
        </button>
      )}

      {open && (
        <div className="sheet-backdrop" onClick={closeSheet}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>{t("capture")}</h3>
            <p className="muted" style={{ marginBlockStart: 0, fontSize: "0.85rem" }}>
              {recording ? t("listening") : t("capture_hint")}
            </p>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("task_placeholder")}
              autoFocus
            />
            <div className="actions">
              <button
                className={`btn ${recording ? "primary" : "ghost"}`}
                onClick={recording ? stopRec : startRec}
              >
                {recording ? "■" : "🎙️"}
              </button>
              <button className="btn" onClick={closeSheet}>
                {t("cancel")}
              </button>
              <button className="btn primary" onClick={send} disabled={sending || !text.trim()}>
                {sending ? "…" : t("send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
