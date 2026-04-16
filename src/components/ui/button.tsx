import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "bg-foreground text-background hover:opacity-90",
        "dark:bg-zinc-100 dark:text-zinc-900",
        className,
      )}
      {...props}
    />
  );
}
