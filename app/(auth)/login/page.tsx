import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { BrandMark } from "@/components/brand/Logo";
import { PsaraBadge } from "@/components/brand/PsaraBadge";
import { TrustLine } from "@/components/brand/TrustLine";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage your security services on 20fourr.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center justify-center gap-12 px-6 py-14 lg:flex-row lg:items-center lg:gap-20 lg:px-10">
      {/* Left column — brand */}
      <section className="flex w-full min-w-0 max-w-[480px] flex-col items-center text-center lg:flex-1 lg:items-start lg:text-left">
        <PsaraBadge className="mb-8 lg:mb-11" />

        <BrandMark />

        <h1 className="mt-5 text-sm font-bold tracking-[3px] text-gold">
          20FOURR
        </h1>
        <p className="text-display-lg mt-2.5 text-text">Welcome Back</p>
        <p className="mt-4 max-w-[420px] text-lg text-text-muted sm:text-xl">
          Sign in to manage your security services
        </p>

        <TrustLine className="mt-10 lg:mt-14" />
      </section>

      {/* Right column — form */}
      <section className="flex w-full min-w-0 max-w-[504px] flex-col lg:flex-1">
        {/* LoginForm reads the `next` param, so it needs a boundary to keep the
            rest of this page statically rendered. */}
        <Suspense fallback={<div className="h-[420px] w-full rounded-card border border-border-soft bg-surface" />}>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
