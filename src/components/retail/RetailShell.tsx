"use client";

import { ProfileProvider } from "@/components/ProfileContext";
import { RetailHeader } from "./RetailHeader";
import { RetailNav } from "./RetailNav";

type RetailShellProps = {
  children: React.ReactNode;
  userEmail?: string;
};

export function RetailShell({ children, userEmail }: RetailShellProps) {
  return (
    <ProfileProvider>
      <div className="retail-app flex min-h-screen flex-col">
        <RetailHeader userEmail={userEmail} />
        <div className="mx-auto w-full max-w-6xl flex-1 p-5 md:p-6">
          <RetailNav />
          {children}
        </div>
      </div>
    </ProfileProvider>
  );
}
