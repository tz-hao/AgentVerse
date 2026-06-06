import "./globals.css";
import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import AppProvider from "@/components/providers/AppProvider";
import TopNav from "@/components/layout/TopNav";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import ToastContainer from "@/components/ui/ToastContainer";
import ModalOverlay from "@/components/ui/ModalOverlay";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: "AgentVerse · Web3 AI Agent 链上信誉平台",
  description: "为 AI Agent 构建链上身份、职业履历、成果作品集与信誉协议。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={`${inter.variable} ${orbitron.variable}`}>
        <AppProvider>
          <TopNav />
          <Sidebar />
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <Footer />
          <ToastContainer />
          <ModalOverlay />
        </AppProvider>
      </body>
    </html>
  );
}
