import "./globals.css";

export const metadata = {
  title: "AI Interview Coach",
  description:
    "Practice real interviews with an AI coach that speaks, understands slang, and gives detailed performance feedback.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
