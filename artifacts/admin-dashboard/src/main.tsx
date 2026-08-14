import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// The admin dashboard is served below /admin/. The generated API client uses
// root-relative /api/* paths, so scope browser requests to /admin/api/* where
// Vite can proxy them to the API server during local/Codespaces development.
if (typeof window !== "undefined") {
  setBaseUrl("/admin");
}

createRoot(document.getElementById("root")!).render(<App />);
