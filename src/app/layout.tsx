import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Config DNS",
  description: "Quản lý cấu hình DNS",
  icons: {
    icon: "/logo-short.png",
    shortcut: "/logo-short.png",
    apple: "/logo-short.png",
  },
  openGraph: {
    title: "Config DNS",
    description: "Quản lý cấu hình DNS",
    type: "website",
    images: [
      {
        url: "/logo-1.png",
        width: 512,
        height: 240,
        alt: "Config DNS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Config DNS",
    description: "Quản lý cấu hình DNS",
    images: ["/logo-1.png"],
  },
  verification: {
    other: {
      "zalo-platform-site-verification":
        process.env.NEXT_PUBLIC_ZALO_SITE_VERIFICATION ??
        "GVsi8u3O0nrSzTX5XD5mIdFWtXMVbWj8E30m",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
