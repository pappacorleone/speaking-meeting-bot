import { redirect } from "next/navigation";

/**
 * Root page redirects to the hub (main dashboard).
 */
export default function Home() {
  redirect("/hub");
}
