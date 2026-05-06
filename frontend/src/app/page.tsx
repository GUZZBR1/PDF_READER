import PageHeader from "@/components/PageHeader";
import ToolCard from "@/components/ToolCard";
import { tools } from "./toolData";

export default function Home() {
  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            PDF
          </span>
          <span>Private PDF Tool</span>
        </div>
        <span className="private-badge">Local workspace</span>
      </nav>

      <PageHeader
        title="Private PDF Tool"
        description="A private workspace for simple PDF operations."
      />

      <section className="tools-grid" aria-label="PDF tools">
        {tools.map((tool) => (
          <ToolCard
            key={tool.href}
            title={tool.title}
            description={tool.description}
            href={tool.href}
          />
        ))}
      </section>

      <section className="mvp-summary" aria-label="MVP status">
        <div>
          <h2>Local backend</h2>
          <p>Frontend requests default to the FastAPI service on port 8000.</p>
        </div>
        <div>
          <h2>Temporary files</h2>
          <p>Uploaded and generated files are cleaned after each response.</p>
        </div>
        <div>
          <h2>MVP scope</h2>
          <p>No accounts, database, cloud storage, or analytics are included.</p>
        </div>
      </section>

      <footer className="app-footer">Private PDF Tool MVP</footer>
    </main>
  );
}
