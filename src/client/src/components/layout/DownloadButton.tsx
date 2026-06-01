"use client";

import { UsaButton } from "@/components/uswds/UsaButton";

type DownloadButtonProps = {
  fileName: string;
  getBlob: () => Promise<Blob>;
  children: string;
};

export function DownloadButton({ fileName, getBlob, children }: DownloadButtonProps) {
  async function handleDownload() {
    const blob = await getBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <UsaButton onClick={handleDownload} type="button">
      {children}
    </UsaButton>
  );
}
