import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description: string;
  showBackLink?: boolean;
};

export default function PageHeader({
  title,
  description,
  showBackLink = false,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      {showBackLink ? (
        <Link className="back-link" href="/">
          Back to tools
        </Link>
      ) : null}
      <p className="eyebrow">Private PDF Tool</p>
      <h1>{title}</h1>
      <p className="subtitle">{description}</p>
    </header>
  );
}
