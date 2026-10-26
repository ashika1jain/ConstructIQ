
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileImage,
  ShieldCheck,
  Upload,
  X,
  AlertTriangle,
  ClipboardCheck,
  Info,
} from "lucide-react";
import "./SiteSafety.css";

const API_URL = "http://127.0.0.1:8000";

type Severity = "Low" | "Medium" | "High" | "Critical";

type SafetyFinding = {
  hazard: string;
  severity: Severity;
  description: string;
  recommendation: string;
};

type SafetyAnalysis = {
  overall_risk: Severity;
  summary: string;
  findings: SafetyFinding[];
  positive_observations: string[];
  limitations: string[];
};

type UploadResult = {
  message: string;
  filename: string;
  size_bytes: number;
  analysis: SafetyAnalysis;
};

type SiteSafetyProps = {
  onBack: () => void;
};

function riskClass(severity: string) {
  return severity.toLowerCase();
}

export default function SiteSafety({ onBack }: SiteSafetyProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(selected: File | undefined) {
    setError("");
    setResult(null);

    if (!selected) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("The image must be 10 MB or smaller.");
      return;
    }

    setFile(selected);
  }

  async function uploadImage() {
    if (!file) {
      setError("Please select a construction site image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_URL}/api/analyze-safety`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Image analysis failed.");
      }

      if (!data.analysis || !Array.isArray(data.analysis.findings)) {
        throw new Error(
          "The server response did not contain a valid safety analysis.",
        );
      }

      setResult(data as UploadResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="safety-page">
      <button className="safety-back" onClick={onBack}>
        <ArrowLeft size={17} /> Back to dashboard
      </button>

      <div className="safety-heading">
        <div className="safety-title-icon">
          <ShieldCheck size={25} />
        </div>
        <div>
          <div className="safety-eyebrow">INTELLIGENCE MODULE / 01</div>
          <h1>Site Safety Analysis</h1>
          <p>
            Upload a construction site image to assess visible safety hazards.
          </p>
        </div>
      </div>

      <div className="safety-workspace">
        <section className="safety-panel">
          <div className="safety-panel-heading">
            <h2>Construction site image</h2>
            <span>JPEG, PNG, WebP</span>
          </div>

          {!file ? (
            <label className="safety-dropzone">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => selectFile(event.target.files?.[0])}
              />
              <div className="safety-upload-icon">
                <Upload size={25} />
              </div>
              <strong>Choose an image to upload</strong>
              <span>Browse your device for a construction site photo</span>
              <span className="safety-size-note">Maximum file size: 10 MB</span>
            </label>
          ) : (
            <div className="safety-preview">
              <img src={preview} alt="Selected construction site" />
              <div className="safety-file-info">
                <FileImage size={20} />
                <div>
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  className="safety-remove"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setError("");
                  }}
                  aria-label="Remove image"
                >
                  <X size={18} />
                </button>
              </div>
              <label className="safety-change">
                Choose another image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                />
              </label>
            </div>
          )}

          {error && <div className="safety-error">{error}</div>}

          <button
            className="safety-submit"
            onClick={uploadImage}
            disabled={!file || loading}
          >
            <Upload size={17} />
            {loading ? "Analyzing image..." : "Analyze site safety"}
          </button>

          <p className="safety-disclaimer">
            AI findings are preliminary visual observations and should be
            verified by a qualified site safety professional.
          </p>
        </section>

        <aside className="safety-panel safety-results">
          <div className="safety-panel-heading">
            <h2>Assessment status</h2>
          </div>

          {loading ? (
            <div className="safety-empty">
              <div className="safety-empty-icon">
                <ShieldCheck size={28} />
              </div>
              <h3>Analyzing construction site</h3>
              <p>
                Gemini is examining the image for visible hazards. This may
                take a little while.
              </p>
            </div>
          ) : result ? (
            <div className="safety-success">
              <CheckCircle2 size={30} />
              <h3>Analysis completed</h3>
              <p>{result.message}</p>

              <div className="safety-result-row">
                <span>Filename</span>
                <strong>{result.filename}</strong>
              </div>
              <div className="safety-result-row">
                <span>File size</span>
                <strong>{(result.size_bytes / 1024).toFixed(1)} KB</strong>
              </div>

              <div className="safety-risk-card">
                <span>Overall risk level</span>
                <strong
                  className={`safety-risk-value ${riskClass(
                    result.analysis.overall_risk,
                  )}`}
                >
                  {result.analysis.overall_risk}
                </strong>
                <p>{result.analysis.summary}</p>
              </div>

              <div className="safety-analysis-section">
                <h3>
                  <AlertTriangle size={18} />
                  Detected hazards ({result.analysis.findings.length})
                </h3>

                {result.analysis.findings.length === 0 ? (
                  <p>No clear hazards were identified in this image.</p>
                ) : (
                  result.analysis.findings.map((finding, index) => (
                    <article className="safety-finding" key={`${finding.hazard}-${index}`}>
                      <div className="safety-finding-heading">
                        <strong>{finding.hazard}</strong>
                        <span
                          className={`safety-severity ${riskClass(
                            finding.severity,
                          )}`}
                        >
                          {finding.severity}
                        </span>
                      </div>
                      <p>{finding.description}</p>
                      <div className="safety-recommendation">
                        <strong>Recommended action</strong>
                        <p>{finding.recommendation}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="safety-analysis-section">
                <h3>
                  <ClipboardCheck size={18} />
                  Positive observations
                </h3>
                {result.analysis.positive_observations.length ? (
                  <ul>
                    {result.analysis.positive_observations.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No positive observations were reported.</p>
                )}
              </div>

              <div className="safety-analysis-section">
                <h3>
                  <Info size={18} />
                  Limitations
                </h3>
                {result.analysis.limitations.length ? (
                  <ul>
                    {result.analysis.limitations.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Visual assessment only. On-site verification is required.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="safety-empty">
              <div className="safety-empty-icon">
                <ShieldCheck size={28} />
              </div>
              <h3>No analysis yet</h3>
              <p>
                Select a construction site image and click Analyze site safety
                to generate AI findings.
              </p>
              <div className="safety-checklist">
                <span>01</span> Select a site image
                <span>02</span> Analyze visible hazards
                <span>03</span> Review findings and actions
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
