import PageHeader from "@/components/PageHeader";
import UploadPlaceholder from "@/components/UploadPlaceholder";

export default function RemovePagesPage() {
  return (
    <main className="app-shell">
      <PageHeader
        title="Remove Pages"
        description="Delete unwanted pages while keeping the rest of the document."
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
