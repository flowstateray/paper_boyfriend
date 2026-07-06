import type { Metadata } from "next";
import Script from "next/script";
import { ChatProvider } from "@/context/ChatContext";
import AuroraBackground from "@/components/AuroraBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "纸片人男友",
  description: "AI虚拟恋爱聊天产品",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-black">
        <AuroraBackground />
        <ChatProvider>{children}</ChatProvider>
        <Script
          src="https://embed.tawk.to/6a4b98bafe1c9c1d48b57957/1jsrkp6ht"
          async
          charset="UTF-8"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
