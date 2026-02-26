"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function DashboardClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const [progressTitle, setProgressTitle] = useState("Analyzing your code...");
  const [stepStates, setStepStates] = useState<
    Record<string, "idle" | "running" | "done">
  >({
    scalability: "idle",
    stability: "idle",
    maintainability: "idle",
    security: "idle",
  });

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }

  function handleDragLeave(e: React.DragEvent) {
    e.currentTarget.classList.remove("drag-over");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    if (e.dataTransfer.files.length) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      handleUpload(e.target.files[0]);
    }
  }

  async function handleUpload(file: File) {
    if (!file.name.endsWith(".zip")) {
      alert("Only .zip files are accepted.");
      return;
    }

    setShowUpload(false);
    setShowProgress(true);
    setStepStates({
      scalability: "running",
      stability: "running",
      maintainability: "running",
      security: "running",
    });

    const formData = new FormData();
    formData.append("code_file", file);

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();

      if (data.error) {
        alert("Error: " + data.error);
        setShowUpload(true);
        setShowProgress(false);
        return;
      }

      pollJob(data.job_id);
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
      setShowUpload(true);
      setShowProgress(false);
    }
  }

  function pollJob(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/api/job/${jobId}`);
        const data = await resp.json();

        if (data.status === "complete") {
          clearInterval(interval);
          setStepStates({
            scalability: "done",
            stability: "done",
            maintainability: "done",
            security: "done",
          });
          setProgressTitle("Analysis complete!");
          setTimeout(() => {
            router.push(`/report/${jobId}`);
          }, 1000);
        } else if (data.status === "failed") {
          clearInterval(interval);
          alert("Analysis failed: " + (data.error || "Unknown error"));
          setShowUpload(true);
          setShowProgress(false);
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  }

  const dimensions = [
    { key: "scalability", icon: "\u21C5", label: "Scalability" },
    { key: "stability", icon: "\u2764", label: "Stability" },
    { key: "maintainability", icon: "\u270E", label: "Maintainability" },
    { key: "security", icon: "\uD83D\uDD12", label: "Security" },
  ];

  return (
    <>
      {/* Upload Area */}
      {showUpload && (
        <div
          className="upload-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">&#x1F4E6;</div>
          <div className="upload-title">
            Drop your project .zip file here
          </div>
          <div className="upload-desc">
            or click to browse &middot; Max 50MB &middot; .zip files only
          </div>
          <div className="upload-warning">
            &#x1F512; Uploaded files are deleted immediately after analysis
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".zip"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Progress */}
      {showProgress && (
        <div className="analysis-progress active">
          <div className="progress-header">
            <div className="spinner"></div>
            <span className="progress-title">{progressTitle}</span>
          </div>
          <div className="progress-steps">
            {dimensions.map((d) => (
              <div
                key={d.key}
                className={`progress-step ${stepStates[d.key]}`}
              >
                <div className="step-icon">{d.icon}</div>
                <div className="step-label">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
