import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "outline" | "secondary" | "unstyled";

type UsaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
};

function variantClass(variant: ButtonVariant) {
  if (variant === "outline") {
    return " usa-button--outline";
  }

  if (variant === "secondary") {
    return " usa-button--secondary";
  }

  if (variant === "unstyled") {
    return " usa-button--unstyled";
  }

  return "";
}

export function UsaButton({ children, variant = "default", href, className = "", ...props }: UsaButtonProps) {
  const classes = `usa-button${variantClass(variant)} ${className}`.trim();

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={props.type ?? "button"} {...props}>
      {children}
    </button>
  );
}
