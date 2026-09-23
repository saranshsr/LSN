import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";

import "./styles/tokens.css";
import "./styles/app.css";
import { installArabicFallback } from "./styles/arabicFallback";
import App from "./App";

installArabicFallback();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Honours prefers-reduced-motion for every Motion animation: transforms
        are dropped, opacity and colour kept. */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
