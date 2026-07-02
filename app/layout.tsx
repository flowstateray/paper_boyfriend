import type { Metadata } from "next";
import { ChatProvider } from "@/context/ChatContext";
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
      <body>
        <ChatProvider>{children}</ChatProvider>
      </body>
    </html>
  );
}