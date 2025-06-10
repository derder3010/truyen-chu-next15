import React from "react";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import EbookWaitingPage from "@/components/EbookWaitingPage";
import { getEbookBySlug } from "@/lib/data/ebooks";
import { APP_CONFIG } from "@/lib/config";

// Add ISR with 2-hour revalidation
export const revalidate = 7200;

interface Props {
  params: {
    slug: string;
  };
}

interface PurchaseLink {
  name?: string;
  store?: string;
  url: string;
}

// Generate metadata cho trang download ebook
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await the params object before using its properties
  const slug = (await params).slug;

  // Get the ebook details
  const ebook = await getEbookBySlug(slug);

  // Get parent metadata (default values)
  const previousImages = (await parent).openGraph?.images || [];

  // If ebook not found, return basic metadata
  if (!ebook) {
    return {
      title: "Ebook không tồn tại",
      description: "Không tìm thấy ebook yêu cầu.",
      robots: { index: false, follow: false },
    };
  }

  const title = `Tải xuống ${ebook.title} - ${ebook.author} | ${APP_CONFIG.APP_NAME}`;
  const description = `Tải xuống ebook ${ebook.title} của tác giả ${ebook.author}. Đang chuẩn bị tệp tải xuống, vui lòng đợi...`;

  return {
    title,
    description,
    keywords: [
      ebook.title,
      ebook.author,
      "download ebook",
      "tải xuống ebook",
      "ebook pdf",
      "ebook epub",
      ...(ebook.genres || []),
    ],
    robots: {
      index: false, // Không index trang download
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${APP_CONFIG.SITE_URL}/ebook/${slug}/download`,
      siteName: APP_CONFIG.APP_NAME,
      locale: "vi_VN",
      type: "website",
      images: ebook.coverImage
        ? [ebook.coverImage, ...previousImages]
        : previousImages,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ebook.coverImage ? [ebook.coverImage] : [],
    },
  };
}

export default async function EbookDownloadPage({ params }: Props) {
  // Get the ebook details
  const slug = (await params).slug;
  const ebook = await getEbookBySlug(slug);

  // If ebook not found, return 404
  if (!ebook) {
    notFound();
  }

  // Extract download URL from purchase links
  let downloadUrl = "";
  if (ebook.purchaseLinks && Array.isArray(ebook.purchaseLinks)) {
    // Find the first download link (could be more specific like looking for "pdf" or "epub")
    const downloadLink = ebook.purchaseLinks.find(
      (link: PurchaseLink) =>
        (link.name && link.name.toLowerCase().includes("pdf")) ||
        (link.name && link.name.toLowerCase().includes("epub")) ||
        (link.store && link.store.toLowerCase().includes("pdf")) ||
        (link.store && link.store.toLowerCase().includes("epub"))
    );

    // If specific download link not found, use the first link
    downloadUrl = downloadLink?.url || ebook.purchaseLinks[0]?.url || "";
  }

  // If no download URL found, use a fallback
  if (!downloadUrl) {
    // Redirect back to ebook page
    return notFound();
  }

  return (
    <EbookWaitingPage
      ebookTitle={ebook.title}
      ebookSlug={ebook.slug}
      downloadUrl={downloadUrl}
    />
  );
}
