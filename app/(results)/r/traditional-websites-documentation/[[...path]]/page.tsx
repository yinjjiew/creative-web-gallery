import { notFound } from "next/navigation";

import { App } from "../App";
import { PAGES, isPage } from "../catalog";

export function generateStaticParams() {
  return PAGES.map((p) => ({
    path: p.slug === "" ? [] : p.slug.split("/"),
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const slug = path?.length ? path.join("/") : "";
  if (!isPage(slug)) notFound();
  return <App slug={slug} />;
}
