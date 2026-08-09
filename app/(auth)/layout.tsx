export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <main className="min-h-screen w-full bg-bg">{children}</main>;
}
