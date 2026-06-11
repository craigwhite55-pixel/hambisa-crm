"use client";

type AlertBarProps = {
  children: React.ReactNode;
};

export function AlertBar({ children }: AlertBarProps) {
  return <div className="alert-bar">{children}</div>;
}
