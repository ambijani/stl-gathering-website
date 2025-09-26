import { redirect } from "next/navigation";
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  redirect("/signup");
  return (
    <>
      <Analytics />
    </>
  );
}
