import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { STORE } from "@/lib/config";
import { getCatalog } from "@/lib/catalog";
import CatalogProvider from "@/components/CatalogProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SampleBanner from "@/components/SampleBanner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: STORE.name,
  description: `${STORE.name}: gadgets for every need. ${STORE.tagline}.`,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalog();
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CatalogProvider catalog={catalog}>
          <SampleBanner />
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
          <Footer />
        </CatalogProvider>
      </body>
    </html>
  );
}
