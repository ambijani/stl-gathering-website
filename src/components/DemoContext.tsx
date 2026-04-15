"use client";
import { createContext, useContext, useEffect, useState } from "react";

const DemoCtx = createContext(false);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    setIsDemo(document.cookie.split(";").some(c => c.trim().startsWith("demo-mode=")));
  }, []);
  return <DemoCtx.Provider value={isDemo}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
  return useContext(DemoCtx);
}

export function BlurredName({ children, className }: { children: React.ReactNode; className?: string }) {
  const isDemo = useDemo();
  if (!isDemo) return <>{children}</>;
  return (
    <span className={`demo-blur select-none pointer-events-none${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}
