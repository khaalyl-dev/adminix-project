
import React, { useState } from "react";
import "./ProjectSetup.css";

function AnimatedLetters({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, idx) => (
        <span
          key={idx}
          className="fade-in-letter"
          style={{ animationDelay: `${idx * 0.04}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </>
  );
}

const ProjectSetup: React.FC = () => {
  const [projectName, setProjectName] = useState("");
  const [step, setStep] = useState(1);
  const [tasks, setTasks] = useState<string[]>(["", ""]);

  return (
    <div className="page-container">
      <div className="setup-wrapper">
        <div className="setup-left">
          <div className="progress-bar-container">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="fade-in">
            {step === 1 ? (
              <>
                <h2 className="fade-in-text" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
                  Let's set up your first project
                </h2>
                <p style={{ color: "#6b7280", marginBottom: 24 }}>
                  What’s something your team is working on?
                </p>
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="input-style"
                />
                <button
                  className="button-primary"
                  onClick={() => setStep(step + 1)}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <h2 className="fade-in-text" style={{ fontWeight: 600, fontSize: 24, marginBottom: 8 }}>
                  What are a few tasks that you have to do for {projectName || "project name"}?
                </h2>
                {tasks.map((task, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={idx === 0 ? "e.g. Design homepage" : "e.g. Share timeline with teammates"}
                    value={task}
                    onChange={e => {
                      const newTasks = [...tasks];
                      newTasks[idx] = e.target.value;
                      setTasks(newTasks);
                    }}
                    className="input-style"
                    style={{ marginBottom: 12 }}
                  />
                ))}
                <button
                  className="button-secondary"
                  onClick={() => setTasks([...tasks, ""])}
                >
                  + Add another task
                </button>
                <br />
                <button
                  className="button-primary"
                  onClick={() => setStep(step + 1)}
                >
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
        {/* Right Side */}
        <div className="project-preview-outer">
          <div className="browser-preview">
            <div className="browser-preview-header">
              <div className="browser-preview-header-button1"></div>
              <div className="browser-preview-header-button2"></div>
              <div className="browser-preview-header-button3"></div>
            </div>
            <div className="project-preview-header">
              <div className="project-preview-chip">
                <svg className="project-preview-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 5C5 6.3805 3.8805 7.5 2.5 7.5C1.1195 7.5 0 6.3805 0 5C0 3.6195 1.1195 2.5 2.5 2.5C3.8805 2.5 5 3.6195 5 5ZM2.5 9.5C1.1195 9.5 0 10.6195 0 12C0 13.3805 1.1195 14.5 2.5 14.5C3.8805 14.5 5 13.3805 5 12C5 10.6195 3.8805 9.5 2.5 9.5ZM2.5 16.5C1.1195 16.5 0 17.6195 0 19C0 20.3805 1.1195 21.5 2.5 21.5C3.8805 21.5 5 20.3805 5 19C5 17.6195 3.8805 16.5 2.5 16.5ZM9 3V7H24V3H9ZM9 14H24V10H9V14ZM9 21H24V17H9V21Z"></path>
                </svg>
              </div>
              <div className="project-preview-title-nav">
                <div className="project-preview-title">
                  {projectName ? (
                    <span className="project-preview-pill">
                      <AnimatedLetters text={projectName} />
                    </span>
                  ) : (
                    <div className="project-preview-pill-placeholder"></div>
                  )}
                </div>
                <div className="project-preview-nav-empty"></div>
              </div>
              <div className="project-preview-right-children">
                <div>
                  <img
                    className="project-preview-avatar"
                    alt=""
                    src="https://d3ki9tyy5l5ruj.cloudfront.net/obj/fa519ac9192b359a39a682eedc6a05fc0a9c7695/Blue hair woman avatar.svg"
                  />
                </div>
                <div className="project-preview-separator"></div>
                <div className="project-preview-search-bar">
                  <svg className="project-preview-search-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                    <path d="M13.999 28c3.5 0 6.697-1.3 9.154-3.432l6.139 6.139a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414l-6.139-6.139A13.93 13.93 0 0 0 27.999 14c0-7.72-6.28-14-14-14s-14 6.28-14 14 6.28 14 14 14Zm0-26c6.617 0 12 5.383 12 12s-5.383 12-12 12-12-5.383-12-12 5.383-12 12-12Z"></path>
                  </svg>
                </div>
                <div className="project-preview-omnibutton">
                  <svg className="project-preview-plus-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                    <path d="M26,14h-8V6c0-1.1-0.9-2-2-2l0,0c-1.1,0-2,0.9-2,2v8H6c-1.1,0-2,0.9-2,2l0,0c0,1.1,0.9,2,2,2h8v8c0,1.1,0.9,2,2,2l0,0c1.1,0,2-0.9,2-2v-8h8c1.1,0,2-0.9,2-2l0,0C28,14.9,27.1,14,26,14z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <div style={{ padding: "32px 24px" }}>
             
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {tasks.map((task, idx) =>
                  task ? (
                    <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                      <svg width="20" height="20" fill="#bbb" style={{ marginRight: 12 }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#bbb" strokeWidth="2" fill="none"/><path d="M8 12l2 2 4-4" stroke="#bbb" strokeWidth="2" fill="none"/></svg>
                      <span style={{ fontSize: 18 }}>
                        <AnimatedLetters text={task} />
                      </span>
                    </li>
                  ) : (
                    <li key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 12, opacity: 0.3 }}>
                      <svg width="20" height="20" fill="#eee" style={{ marginRight: 12 }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#eee" strokeWidth="2" fill="none"/></svg>
                      <span style={{ fontSize: 18 }} key={task + idx}> </span>
                    </li>
                  )
                )}
                {/* Add empty lines for visual balance */}
                {Array.from({ length: Math.max(0, 8 - tasks.length) }).map((_, idx) => (
                  <li key={tasks.length + idx} style={{ display: "flex", alignItems: "center", marginBottom: 12, opacity: 0.15 }}>
                    <svg width="20" height="20" fill="#eee" style={{ marginRight: 12 }} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#eee" strokeWidth="2" fill="none"/></svg>
                    <span style={{ fontSize: 18 }} key={tasks.length + idx}> </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSetup;