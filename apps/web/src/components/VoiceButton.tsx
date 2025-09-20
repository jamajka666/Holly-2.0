import React, { useState, useRef } from "react";

export default function VoiceButton() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = async () => {
    setError("");
    setTranscript("");
    setListening(true);
    // Try server STT first
    // Fallback: Web Speech API
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "cs-CZ";
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        setTranscript(e.results[0][0].transcript);
      };
      recognition.onerror = (e: any) => {
        setError("Speech API error: " + e.error);
        setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } else {
      setError("Web Speech API není dostupné. Zkuste serverové STT.");
      setListening(false);
    }
  };

  const stopListening = () => {
    setListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000 }}>
      <button
        onClick={listening ? stopListening : startListening}
        style={{
          background: listening ? "#39ff14" : "#23272e",
          color: "#0b0f1a",
          borderRadius: "50%",
          width: 64,
          height: 64,
          boxShadow: "0 0 8px #39ff14",
          border: "none",
          fontSize: 32,
          cursor: "pointer",
        }}
        aria-label="Press to talk"
      >
        🎤
      </button>
      {transcript && (
        <div style={{ background: "#181a20", color: "#39ff14", padding: 8, borderRadius: 8, marginTop: 8, boxShadow: "0 1px 4px #23272e" }}>
          {transcript}
        </div>
      )}
      {error && (
        <div style={{ background: "#ff1744", color: "#fff", padding: 8, borderRadius: 8, marginTop: 8, boxShadow: "0 1px 4px #23272e" }}>
          <strong>Chyba:</strong> {error}
        </div>
      )}
    </div>
  );
}
