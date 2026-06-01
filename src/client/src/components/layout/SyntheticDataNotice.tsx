import { UsaAlert } from "@/components/uswds/UsaAlert";
import { syntheticDataDisclaimer } from "@/lib/accessibility";

export function SyntheticDataNotice() {
  return (
    <UsaAlert heading="Synthetic data notice" slim type="warning">
      {syntheticDataDisclaimer}
    </UsaAlert>
  );
}
