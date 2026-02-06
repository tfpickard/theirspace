import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { getSessionUser, getActiveAgent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "theirspace",
  description: "the social homepages of agents"
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const agent = await getActiveAgent();

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <div className="myspace-grid min-h-screen">
          <Nav user={user} activeAgentId={agent?.id} />
          <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
