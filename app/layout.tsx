import type { Metadata } from "next";
import { headers } from "next/headers";

import { ClaimGuideProviders } from "@/components/claim-guide/providers";

import "./globals.css";

const title = "보험금 길잡이 Agent";
const description =
  "고령 부모의 보험을 대신 챙기는 가족을 위한 약관 근거 기반 보험금 확인·행동 Agent";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const imageUrl = new URL("/og-v2.png", baseUrl).toString();

  return {
    metadataBase: baseUrl,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: imageUrl, alt: "보험금 길잡이 Agent 근거 지도" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <ClaimGuideProviders>{children}</ClaimGuideProviders>
      </body>
    </html>
  );
}
