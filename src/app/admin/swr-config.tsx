"use client";
import { useEffect } from "react";
import { SWRConfig } from "swr";

export function SWRConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    console.log(
      "%c█▄▄ █▀▀ ▀█▀ ▀█▀ █▀▀ █▀█\n█▄█ █▄▄  █   █  █▄▄ █▀▄\n\n%c⛓️ Just a Better Chatbot - Admin\nhttps://github.com/cgoinglove/better-chatbot",
      "color: #ff6b35; font-weight: bold; font-family: monospace; font-size: 16px; text-shadow: 0 0 10px #ff6b35;",
      "color: #888; font-size: 12px;",
    );
  }, []);
  return (
    <SWRConfig
      value={{
        focusThrottleInterval: 30000,
        dedupingInterval: 2000,
        errorRetryCount: 1,
      }}
    >
      {children}
    </SWRConfig>
  );
}
