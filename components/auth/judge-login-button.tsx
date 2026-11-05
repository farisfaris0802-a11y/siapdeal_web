"use client";

import { useFormStatus } from "react-dom";
import { Gavel, Loader2, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePreSessionTransition } from "@/components/transitions/pre-session-transition";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;

export function JudgeLoginButton({
  label = "Quick Demo Login",
  pendingLabel = "Menyiapkan mode demo...",
  variant = "default",
  size = "lg",
  className,
  icon = "gavel",
  rememberJudgeMode = false,
  hideLabelOnMobile = false,
  mobileLabel,
  transitionOnSubmit = false,
}: {
  label?: string;
  pendingLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  icon?: "gavel" | "sparkles" | "target";
  rememberJudgeMode?: boolean;
  hideLabelOnMobile?: boolean;
  mobileLabel?: string;
  transitionOnSubmit?: boolean;
}) {
  const { pending } = useFormStatus();
  const { start } = usePreSessionTransition();
  const Icon = icon === "sparkles" ? Sparkles : icon === "target" ? Target : Gavel;

  return (
    <Button
      type="submit"
      size={size}
      variant={variant}
      disabled={pending}
      className={cn("group", className)}
      aria-label={mobileLabel || hideLabelOnMobile ? label : undefined}
      onClick={(event) => {
        if (rememberJudgeMode) {
          window.localStorage.setItem("siapdeal_mode_juri", "true");
        }

        if (transitionOnSubmit) {
          const form = event.currentTarget.form;
          if (form) {
            event.preventDefault();
            start(() => form.requestSubmit());
          }
        }
      }}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>
            {pendingLabel}
          </span>
        </>
      ) : (
        <>
          <Icon className="h-4 w-4" />
          {mobileLabel ? (
            <>
              <span className="sm:hidden">{mobileLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </>
          ) : (
            <span className={hideLabelOnMobile ? "hidden sm:inline" : undefined}>
              {label}
            </span>
          )}
        </>
      )}
    </Button>
  );
}
