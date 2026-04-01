import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BrutalistCardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export function BrutalistCard({
  className,
  active,
  children,
  ...props
}: BrutalistCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-rai-obsidian)] border border-[var(--color-glass-border)] rounded-2xl p-6 transition-all duration-300",
        "hover:border-[var(--color-rai-acid)]/50",
        active && "border-[var(--color-rai-acid)] shadow-[var(--shadow-soft)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function BrutalistButton({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const baseStyles = "px-6 py-3 font-display uppercase tracking-widest text-sm font-bold transition-all border outline-none";
  
  const variants = {
    primary: "bg-[var(--color-rai-acid)] border-[var(--color-rai-acid)] text-[var(--color-rai-obsidian)] hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]",
    secondary: "bg-[var(--color-rai-obsidian)] border-[var(--color-glass-border)] text-[var(--color-rai-text)] hover:border-[var(--color-rai-acid)] hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]",
    danger: "bg-[var(--color-rai-orange)] border-[var(--color-rai-orange)] text-[var(--color-rai-obsidian)] hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]",
    ghost: "border-transparent text-[var(--color-rai-text)] hover:text-[var(--color-rai-acid)]",
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
