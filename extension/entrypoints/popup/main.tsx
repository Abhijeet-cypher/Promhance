import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { browser } from "wxt/browser";
import "./style.css";

type Intensity = "low" | "medium" | "high";

function Popup() {
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [anonId, setAnonId] = useState<string>("");

  useEffect(() => {
    void browser.storage.local.get(["default_intensity", "promhance_anon_id"]).then((data) => {
      setIntensity((data.default_intensity as Intensity) ?? "medium");
      setAnonId((data.promhance_anon_id as string) ?? "");
    });
  }, []);

  function update(value: Intensity) {
    setIntensity(value);
    void browser.storage.local.set({ default_intensity: value });
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <span className="popup-dot" />
        <h1>Promhance</h1>
      </header>

      <p className="popup-lede">
        Enhance rough prompts into engineered prompts, right on ChatGPT, Claude, Gemini,
        Midjourney and Copilot.
      </p>

      <section className="popup-section">
        <label className="popup-label">Default enhancement depth</label>
        <div className="popup-seg">
          {(["low", "medium", "high"] as Intensity[]).map((id) => (
            <button
              key={id}
              className={intensity === id ? "seg-item active" : "seg-item"}
              onClick={() => update(id)}
            >
              {id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <a
        className="popup-link"
        href="https://www.promhance.com"
        target="_blank"
        rel="noreferrer"
      >
        Open Promhance web app &#8599;
      </a>

      {anonId && <p className="popup-meta">Device ID: {anonId.slice(0, 8)}…</p>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Popup />);
