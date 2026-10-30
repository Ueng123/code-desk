import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Desk · 나만의 풀이 공간",
  description:
    "태블릿에서 차분하게 생각하고 코드를 작성하는 코딩테스트 워크스페이스 UI 미리보기",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
