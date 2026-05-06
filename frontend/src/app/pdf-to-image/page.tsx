import PageHeader from "@/components/PageHeader";
import UploadPlaceholder from "@/components/UploadPlaceholder";

export default function PdfToImagePage() {
  return (
    <main className="app-shell">
      <PageHeader
        title="PDF to Image"
        description="Export PDF pages as image files."
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
