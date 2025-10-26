import App from "./App.tsx";
import { StrictMode } from "react";
import "./index.css"; // eslint-disable-line import/no-unassigned-import
import { createRoot } from "react-dom/client";

const root = document.querySelector("#root");

if (!root) {
    throw new Error("Root element not found");
}

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
