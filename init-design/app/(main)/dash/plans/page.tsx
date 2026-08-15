import { redirect } from "next/navigation";

export default function PlansRedirectPage() {
  redirect("/dash/manage-account/billing");
}
