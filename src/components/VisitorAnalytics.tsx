import { useEffect } from "react";

const goatCounterUrl = import.meta.env.VITE_GOATCOUNTER_URL?.trim();
const scriptId = "goatcounter-analytics";

export function VisitorAnalytics() {
  useEffect(() => {
    if (!goatCounterUrl || document.getElementById(scriptId)) return;

    let endpoint: URL;
    try {
      endpoint = new URL(goatCounterUrl);
    } catch {
      console.error("VITE_GOATCOUNTER_URL must be a valid HTTPS /count URL.");
      return;
    }

    if (
      endpoint.protocol !== "https:" ||
      !endpoint.pathname.endsWith("/count") ||
      endpoint.username ||
      endpoint.password
    ) {
      console.error("VITE_GOATCOUNTER_URL must be a valid HTTPS /count URL.");
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.dataset.goatcounter = endpoint.toString();
    script.src = "https://gc.zgo.at/count.js";
    document.head.append(script);
  }, []);

  return null;
}
