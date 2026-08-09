import type { Metadata } from "next";
import { SubPage } from "@/components/dashboard/SubPage";
import { EditProfileForm } from "./EditProfileForm";

export const metadata: Metadata = { title: "Edit Profile" };

export default function EditProfilePage() {
  return (
    <SubPage
      title="Edit Profile"
      subtitle="Personal details, address, GST status and booking defaults."
    >
      <EditProfileForm />
    </SubPage>
  );
}
