/**
 * Implementation of the "Button" component from:
 * https://www.figma.com/file/sfCE7iLS0k25qCxiifQNLE/%F0%9F%93%9A-Webstudio-Library?node-id=4%3A2709
 */

import {
  forwardRef,
  type Ref,
  type ComponentProps,
  type ReactNode,
} from "react";
import { typography } from "./typography";
import { styled, theme } from "../stitches.config";

type State = "auto" | "hover" | "focus" | "pressed" | "pending";

const variants = [
  "primary",
  "destructive",
  "positive",
  "neutral",
  "ghost",
] as const;

type Variant = typeof variants[number];

const bg: Record<Variant, string> = {
  primary: theme.colors.backgroundPrimary,
  neutral: theme.colors.backgroundNeutralMain,
  destructive: theme.colors.backgroundDestructiveMain,
  positive: theme.colors.backgroundSuccessMain,
  ghost: theme.colors.backgroundHover,
};

const fg: Record<Variant, string> = {
  primary: theme.colors.foregroundContrastMain,
  destructive: theme.colors.foregroundContrastMain,
  positive: theme.colors.foregroundContrastMain,
  neutral: theme.colors.foregroundMain,
  ghost: theme.colors.foregroundMain,
};

// CSS supports multiple gradients as backgrounds but not multiple colors
const backgroundColors = (base: string, overlay: string) =>
  `linear-gradient(${overlay}, ${overlay}), linear-gradient(${base}, ${base})`;

const variantStyle = (variant: Variant) => ({
  background: variant === "ghost" ? "transparent" : bg[variant],
  color: fg[variant],

  "&[data-button-state=auto]:hover:not([disabled]), &[data-button-state=hover]:not([disabled])":
    {
      background: backgroundColors(
        bg[variant],
        theme.colors.backgroundButtonHover
      ),
    },

  "&[data-button-state=auto]:focus-visible:not([disabled]), &[data-button-state=focus]:not([disabled])":
    {
      outline: `2px solid ${theme.colors.borderFocus}`,
      outlineOffset: "1px",
    },

  "&[data-button-state=auto]:active:not([disabled]), &[data-button-state=pressed]:not([disabled])":
    {
      background: backgroundColors(
        bg[variant],
        theme.colors.backgroundButtonPressed
      ),
    },

  "&[disabled]:not([data-button-state=pending])": {
    background: theme.colors.backgroundButtonDisabled,
    color: theme.colors.foregroundDisabled,
  },

  "&[data-button-state=pending]": {
    cursor: "wait",
  },
});

const StyledButton = styled("button", {
  all: "unset",
  boxSizing: "border-box",
  minWidth: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing[2],
  padding: `0 ${theme.spacing[4]}`,
  height: theme.spacing[12],
  borderRadius: theme.borderRadius[4],

  variants: {
    // in Figma this property is called "color"
    variant: {
      primary: variantStyle("primary"),
      destructive: variantStyle("destructive"),
      positive: variantStyle("positive"),
      neutral: variantStyle("neutral"),
      ghost: variantStyle("ghost"),
    },
  },

  defaultVariants: {
    variant: "primary",
  },
});

const TextContainer = styled("span", typography.labelTitleCase, {
  padding: `0 ${theme.spacing[2]}`,
});

type ButtonProps = {
  state?: State;
  variant?: Variant;

  // prefix/suffix are primarily for Icons
  // this is a replacement for icon/icon-left/icon-right in Figma
  prefix?: ReactNode;
  suffix?: ReactNode;
} & Omit<ComponentProps<"button">, "prefix">;

export const Button = forwardRef(
  (
    {
      disabled,
      state = "auto",
      prefix,
      suffix,
      children,
      ...restProps
    }: ButtonProps,
    ref: Ref<HTMLButtonElement>
  ) => {
    return (
      <StyledButton
        {...restProps}
        disabled={disabled || state === "pending"}
        data-button-state={state}
        ref={ref}
      >
        {prefix}
        {children && (
          <TextContainer>
            {children}
            {state === "pending" ? "…" : ""}
          </TextContainer>
        )}
        {suffix}
      </StyledButton>
    );
  }
);
Button.displayName = "Button";
