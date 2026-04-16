import { createRoot } from "react-dom/client";
import { Component, ErrorInfo, ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: "#0a0a0a", color: "#fff", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
          <h1 style={{ color: "#D4AF37", marginBottom: 16 }}>Something went wrong</h1>
          <pre style={{ color: "#ff6b6b", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 14 }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ color: "#888", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, marginTop: 16 }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, padding: "12px 24px", background: "#D4AF37", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
