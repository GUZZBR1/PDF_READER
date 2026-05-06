import Link from "next/link";

type ToolCardProps = {
  title: string;
  description: string;
  href: string;
};

export default function ToolCard({ title, description, href }: ToolCardProps) {
  return (
    <Link className="tool-card" href={href}>
      <h2 className="tool-card-title">{title}</h2>
      <p className="tool-card-description">{description}</p>
      <span className="tool-card-action">Open tool</span>
    </Link>
  );
}
