import PageHeader from "@/components/PageHeader";
import UploadPlaceholder from "@/components/UploadPlaceholder";

export default function SplitPage() {
  return (
    <main className="app-shell">
      <PageHeader
        title="Split PDF"
        description="Extract selected pages into a separate PDF file."
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
