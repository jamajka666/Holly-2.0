import React, { useState } from "react";

export default function DeviceDemo() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const exec = async (adapter: string, action: string, args: string[] = []) => {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/device/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adapter, action, args })
      });
      const data = await res.json();
      setResult(data.output || JSON.stringify(data));
    } catch (e) {
      setResult("Chyba: " + e);
    }
    setLoading(false);
  };

  return (
    <div style={{ margin: 24 }}>
      <button onClick={() => exec("network", "ping", ["192.168.1.1", "-c", "1"])} disabled={loading}>
        Ping gateway
      </button>
      <button onClick={() => exec("androidADB", "adb shell am start -n", ["com.example/.MainActivity"])} disabled={loading} style={{ marginLeft: 12 }}>
        Open app XYZ
      </button>
      <div style={{ marginTop: 16, background: "#181a20", color: "#39ff14", padding: 8, borderRadius: 8 }}>{result}</div>
    </div>
  );
}
