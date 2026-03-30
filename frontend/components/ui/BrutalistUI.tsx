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
        "bg-[var(--color-rai-obsidian)] border border-[var(--color-rai-gray)] p-6 transition-all duration-300",
        "hover:border-[var(--color-rai-text)]",
        active && "border-[var(--color-rai-acid)] shadow-[4px_4px_0px_0px_var(--color-rai-acid)]",
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
    primary: "bg-[var(--color-rai-acid)] border-[var(--color-rai-acid)] text-[var(--color-rai-obsidian)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-rai-text)]",
    secondary: "bg-[var(--color-rai-obsidian)] border-[var(--color-rai-gray)] text-[var(--color-rai-text)] hover:border-[var(--color-rai-text)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-rai-acid)]",
    danger: "bg-[var(--color-rai-orange)] border-[var(--color-rai-orange)] text-[var(--color-rai-black)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-rai-gray)]",
    ghost: "border-transparent text-[var(--color-rai-text)] hover:text-[var(--color-rai-acid)]",
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
