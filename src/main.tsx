import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import debug script in development
if (import.meta.env.DEV) {
  import('./debug-firestore');
}

createRoot(document.getElementById("root")!).render(<App />);
