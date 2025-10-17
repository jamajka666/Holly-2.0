import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/globals.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implement real authentication
    console.log("Logging in:", { username, password });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-slate-900 to-black">
      <form onSubmit={handleSubmit} className="bg-white/10 p-8 rounded-lg shadow-lg backdrop-blur-md max-w-sm w-full">
        <h2 className="text-2xl text-white mb-6 text-center">Přihlášení</h2>
        <div className="mb-4">
          <label className="block text-sm text-neutral-200 mb-1">Uživatelské jméno</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="w-full p-2 rounded bg-black/40 text-white outline-none"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm text-neutral-200 mb-1">Heslo</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full p-2 rounded bg-black/40 text-white outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 rounded"
        >
          Přihlásit se
        </button>
      </form>
    </div>
  );
}
