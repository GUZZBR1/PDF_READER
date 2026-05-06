import PageHeader from "@/components/PageHeader";
import UploadPlaceholder from "@/components/UploadPlaceholder";

export default function CompressPage() {
  return (
    <main className="app-shell">
      <PageHeader
        title="Compress PDF"
        description="Reduce PDF file size for easier storage and sharing."
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
