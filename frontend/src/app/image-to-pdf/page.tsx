import PageHeader from "@/components/PageHeader";
import UploadPlaceholder from "@/components/UploadPlaceholder";

export default function ImageToPdfPage() {
  return (
    <main className="app-shell">
      <PageHeader
        title="Image to PDF"
        description="Turn one or more images into a single PDF."
        showBackLink
      />
      <div className="tool-layout">
        <UploadPlaceholder buttonLabel="Select images" />
        <aside className="status-panel">
          <span className="status-label">Not connected</span>
          <p>API integration coming next</p>
        </aside>
      </div>
    </main>
  );
}
