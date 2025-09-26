import { redirect } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";

export default function Home() {
  redirect("/signup");
  return (
    <html lang="en">
      <body>
        <Analytics />
      </body>
    </html>
  );
}
