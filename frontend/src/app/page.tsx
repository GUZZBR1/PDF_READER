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
    </main>
  );
}
