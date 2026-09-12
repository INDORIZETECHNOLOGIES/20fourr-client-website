import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";
import { BackButton } from "@/components/ui/BackButton";
import { PsaraBadge } from "@/components/brand/PsaraBadge";
import { TrustLine } from "@/components/brand/TrustLine";
import { BrandMark } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Create account",
  description: "Sign up as a security services provider on 20fourr.",
};

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center gap-12 px-6 py-14 lg:flex-row lg:items-start lg:gap-20 lg:px-10 lg:py-16">
      {/* Left column — brand. Sticky on desktop, as in the design. */}
      <section className="flex w-full min-w-0 max-w-[460px] flex-col items-start lg:sticky lg:top-16 lg:flex-1">
        {/* <BackButton href="/login" label="Back to sign in" className="mb-8 lg:mb-11" /> */}
        <PsaraBadge className="mb-7" />
        <BrandMark />

        <h1 className="mt-5 text-eyebrow text-fg">20fourr</h1>
        <p className="text-h1 mt-3 text-fg">Create an account</p>
        <p className="mt-4 max-w-[400px] text-body text-fg-mid">
          Book licensed guards, with an OTP at both ends of the shift and a GST document after.
        </p>

        <TrustLine className="mt-10 lg:mt-12" />
      </section>

      {/* Right column — form */}
      <section className="flex w-full min-w-0 max-w-[560px] flex-col lg:flex-1">
        <SignupForm />
      </section>
    </div>
  );
}
