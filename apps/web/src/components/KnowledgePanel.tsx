import React, { useState } from "react";

export default function KnowledgePanel() {
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const addNote = async () => {
    await fetch("/api/learning/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: note })
    });
    setNote("");
  };

  const search = async () => {
    const res = await fetch(`/api/learning/query?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results || []);
  };

  return (
    <div style={{ background: "#181a20", color: "#39ff14", padding: 16, borderRadius: 12, margin: 24 }}>
      <h3>Knowledge</h3>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add note" style={{ marginRight: 8 }} />
      <button onClick={addNote}>Add</button>
      <br />
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" style={{ marginRight: 8, marginTop: 8 }} />
      <button onClick={search}>Search</button>
      <ul>
        {results.map((r, i) => (
          <li key={i}>{r.text} <span style={{ opacity: 0.5 }}>({r.score?.toFixed(2)})</span></li>
        ))}
      </ul>
    </div>
  );
}
