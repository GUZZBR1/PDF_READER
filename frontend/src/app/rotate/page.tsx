import PageHeader from "@/components/PageHeader";
import UploadPlaceholder from "@/components/UploadPlaceholder";

export default function RotatePage() {
  return (
    <main className="app-shell">
      <PageHeader
        title="Rotate PDF"
        description="Rotate all pages or selected page ranges."
        showBackLink
      />
      <div className="tool-layout">
        <UploadPlaceholder buttonLabel="Select PDF" />
        <aside className="status-panel">
          <span className="status-label">Not connected</span>
          <p>API integration coming next</p>
        </aside>
      </div>
    </main>
  );
}
