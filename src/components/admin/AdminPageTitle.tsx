import React from "react";

type AdminPageTitleProps = {
  title: string;
  description?: string;
};

export function AdminPageTitle({ title, description }: AdminPageTitleProps) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="text-base-content/70">{description}</p>}
      <div className="breadcrumbs text-sm">
        <ul>
          <li>Admin</li>
          <li>{title}</li>
        </ul>
      </div>
    </div>
  );
}
