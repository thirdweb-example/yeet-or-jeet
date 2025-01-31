"use client";

import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import styles from "./ClientOnly.module.css";

interface ClientOnlyProps {
  /**
   * Use this to server render a skeleton or loading state
   */
  ssr: ReactNode;
  fadeInDuration?: number;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}

export const ClientOnly: React.FC<ClientOnlyProps> = ({
  children,
  fadeInDuration,
  ssr,
  style,
  className,
}) => {
  const hasMounted = useIsClientMounted();

  if (!hasMounted) {
    return <> {ssr} </>;
  }

  return (
    <div
      className={cn(styles.fadeIn, className)}
      style={{
        animationDuration: `${fadeInDuration}ms`,
        opacity: fadeInDuration ? 0 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

function useIsClientMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
