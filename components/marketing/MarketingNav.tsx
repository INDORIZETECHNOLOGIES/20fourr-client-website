"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/coverage", label: "Coverage" },
  { href: "/for-business", label: "For business" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSignedIn(Boolean(data?.user));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={[
        "sticky top-0 z-50 bg-paper",
        scrolled ? "border-b border-rule" : "border-b border-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 lg:px-6">
        <Link href="/" aria-label="20fourr home" className="shrink-0">
          <Logo variant="dark" width={104} priority />
        </Link>

        <nav className="hidden flex-1 items-center gap-6 lg:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-body text-ink-mid hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {signedIn ? (
            <Link href="/dashboard" className="text-body text-ink-mid hover:text-ink">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-body text-ink-mid hover:text-ink">
              Sign in
            </Link>
          )}
          <Link
            href="/book"
            className="inline-flex h-10 items-center justify-center rounded-sm bg-ink px-4 text-body font-medium text-paper"
          >
            Book a guard
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-sm border border-edge lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="text-body text-ink">
            {open ? "Close" : "Menu"}
          </span>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 top-16 z-40 bg-paper px-6 py-8 lg:hidden"
        >
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-h3 text-ink"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href={signedIn ? "/dashboard" : "/login"} className="text-h3 text-ink">
              {signedIn ? "Dashboard" : "Sign in"}
            </Link>
            <Link
              href="/book"
              className="mt-4 inline-flex h-12 items-center justify-center rounded-sm bg-ink px-5 text-body font-medium text-paper"
              onClick={() => setOpen(false)}
            >
              Book a guard
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
