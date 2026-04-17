"use client";
import { useEffect } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light-theme");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  return <>{children}</>;
}
