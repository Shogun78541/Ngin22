import "./globals.css";

export const metadata = {
  title: "JobFinder",
  description: "Find jobs that match your skills and preferences."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
