import { SessionProvider } from "@/components/SessionProvider";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <div className="">{children}</div>
    </SessionProvider>
  );
}
