"use client";

import { useEffect, useState } from "react";

import { UsaAlert } from "@/components/uswds/UsaAlert";
import { getPowerBiEmbedConfig, type PowerBiEmbedConfig } from "@/lib/api-client";

export function PowerBiReportFrame() {
  const [config, setConfig] = useState<PowerBiEmbedConfig | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      const result = await getPowerBiEmbedConfig();
      if (isMounted) {
        setConfig(result);
      }
    }

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!config) {
    return (
      <UsaAlert slim type="info">
        Checking Power BI embed configuration.
      </UsaAlert>
    );
  }

  if (!config.enabled) {
    return (
      <UsaAlert heading="Power BI placeholder" type="info">
        {config.message}
      </UsaAlert>
    );
  }

  return (
    <section className="powerbi-frame" aria-label="Embedded Power BI report">
      <p>Power BI embedding is enabled. The production report frame would render here using configured embed tokens.</p>
    </section>
  );
}
