import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Change Password" };

export default function ChangePasswordPage() {
  return (
    <SubPage
      title="Change Password"
      subtitle="Changing your password signs you out everywhere else."
      width={560}
    >
      <ChangePasswordForm />
    </SubPage>
  );
}
