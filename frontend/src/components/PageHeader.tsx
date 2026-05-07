import Link from "next/link";

import LogoutButton from "@/components/LogoutButton";

type PageHeaderProps = {
  title: string;
  description: string;
  showBackLink?: boolean;
  showLogout?: boolean;
};

export default function PageHeader({
  title,
  description,
  showBackLink = false,
  showLogout,
}: PageHeaderProps) {
  const shouldShowLogout = showLogout ?? showBackLink;

  return (
    <header className="page-header">
      {showBackLink || shouldShowLogout ? (
        <div className="page-header-actions">
          {showBackLink ? (
            <Link className="back-link" href="/">
              Back to tools
            </Link>
          ) : (
            <span />
          )}
          {shouldShowLogout ? <LogoutButton /> : null}
        </div>
      ) : null}
      <p className="eyebrow">Private PDF Tool</p>
      <h1>{title}</h1>
      <p className="subtitle">{description}</p>
    </header>
  );
}
