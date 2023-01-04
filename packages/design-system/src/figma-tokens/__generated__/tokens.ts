// Generated by transform.ts

export const boxShadow = {
  menuDropShadow: [
    { color: "#00000026", type: "dropShadow", x: 0, y: 5, blur: 17, spread: 0 },
    { color: "#0000001a", type: "dropShadow", x: 0, y: 2, blur: 7, spread: 0 },
  ],
  brandElevationSmall: {
    color: "#1717171a",
    type: "dropShadow",
    x: 0,
    y: 4,
    blur: 4,
    spread: 0,
  },
  brandElevationBig: {
    color: "#1717171a",
    type: "dropShadow",
    x: 0,
    y: 8,
    blur: 16,
    spread: 0,
  },
  innerGlow01: {
    color: "#fbf8ff",
    type: "innerShadow",
    x: 0,
    y: 2,
    blur: 1,
    spread: 0,
  },
  innerGlow03: {
    color: "#fbf8ff",
    type: "innerShadow",
    x: 0,
    y: 5,
    blur: 3,
    spread: 0,
  },
  innerGlow05: {
    color: "#fbf8ff",
    type: "innerShadow",
    x: 0,
    y: 8,
    blur: 5,
    spread: 0,
  },
} as const;

export const fontFamilies = {
  inter: "Inter",
  roboto: "Roboto",
  manrope: "Manrope",
} as const;

export const lineHeights = { "0": 16, "1": 8, "2": 10, "3": "AUTO" } as const;

export const fontWeights = {
  inter0: "Regular",
  inter1: "Medium",
  inter2: "Bold",
  roboto3: "Regular",
  inter4: "Semi Bold",
  manrope5: "SemiBold",
} as const;

export const fontSizes = {
  fontSize0: 8,
  fontSize1: 10,
  fontSize2: 12,
  fontSize3: 20,
  fontSize4: 32,
} as const;

export const letterSpacing = {
  "0": "0.5%",
  "1": "1%",
  "2": "0%",
  "3": 0,
} as const;

export const paragraphSpacing = { "0": 0 } as const;

export const typography = {
  regular: {
    fontFamily: "Inter",
    fontWeight: "Regular",
    lineHeight: 16,
    fontSize: 12,
    letterSpacing: "0.5%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "none",
    textDecoration: "none",
  },
  labels: {
    fontFamily: "Inter",
    fontWeight: "Medium",
    lineHeight: 16,
    fontSize: 12,
    letterSpacing: "0.5%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "none",
    textDecoration: "none",
  },
  titles: {
    fontFamily: "Inter",
    fontWeight: "Bold",
    lineHeight: 16,
    fontSize: 12,
    letterSpacing: "1%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "none",
    textDecoration: "none",
  },
  mono: {
    fontFamily: "Roboto",
    fontWeight: "Regular",
    lineHeight: 16,
    fontSize: 12,
    letterSpacing: "0%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "none",
    textDecoration: "none",
  },
  tiny: {
    fontFamily: "Inter",
    fontWeight: "Medium",
    lineHeight: 8,
    fontSize: 8,
    letterSpacing: "1%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "none",
    textDecoration: "none",
  },
  unit: {
    fontFamily: "Inter",
    fontWeight: "Medium",
    lineHeight: 10,
    fontSize: 10,
    letterSpacing: 0,
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "uppercase",
    textDecoration: "none",
  },
  spacingSectionValueText: {
    fontFamily: "Inter",
    fontWeight: "Medium",
    lineHeight: 10,
    fontSize: 10,
    letterSpacing: "0%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "none",
    textDecoration: "none",
  },
  spacingSectionUnitText: {
    fontFamily: "Inter",
    fontWeight: "Semi Bold",
    lineHeight: 8,
    fontSize: 8,
    letterSpacing: "1%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "uppercase",
    textDecoration: "none",
  },
  bigTitle: {
    fontFamily: "Inter",
    fontWeight: "Medium",
    lineHeight: "AUTO",
    fontSize: 32,
    letterSpacing: "0.5%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "none",
    textDecoration: "none",
  },
  brandTitle: {
    fontFamily: "Manrope",
    fontWeight: "SemiBold",
    lineHeight: "AUTO",
    fontSize: 20,
    letterSpacing: "0.5%",
    paragraphSpacing: 0,
    paragraphIndent: "{paragraphIndent.0}",
    textCase: "none",
    textDecoration: "none",
  },
} as const;

export const textCase = { none: "none", uppercase: "uppercase" } as const;

export const textDecoration = { none: "none" } as const;

export const borderRadius = {
  radius1: "1px",
  radius2: "2px",
  radius3: "3px",
  radius4: "4px",
  radius5: "5px",
  radius6: "6px",
} as const;

export const color = {
  white: "#ffffff",
  black: "#000000",
  backgroundPanel: "#f8f8f8",
  backgroundPrimary: "#0081f1",
  backgroundHover: "#dfe3e6",
  backgroundActive: "#0081f1",
  backgroundMenu: "#ededed",
  backgroundControls: "#ffffff",
  backgroundAssetcardHover: "#e6e8eb",
  backgroundBrandGradient: "linear-gradient(180deg, #e63cfe 0%, #ffae3c 100%)",
  backgroundNeutralMain: "#687076",
  backgroundNeutralAccent: "#11181c",
  backgroundNeutralNotification: "#ffffff",
  backgroundDestructiveMain: "#dc3d43",
  backgroundDestructiveNotification: "#ffefef",
  backgroundSuccessMain: "#299764",
  backgroundSuccessNotification: "#e9f9ee",
  backgroundAlertMain: "#f5d90a",
  backgroundAlertNotification: "#fffbd1",
  backgroundInfoMain: "#006adc",
  backgroundInfoNotification: "#edf6ff",
  backgroundPresetMain: "#dfe3e6",
  backgroundPresetHover: "#d7dbdf",
  backgroundSetMain: "#e1f0ff",
  backgroundSetHover: "#cee7fe",
  backgroundInheritedMain: "#ffe8d7",
  backgroundInheritedHover: "#ffdcc3",
  backgroundInputSelected: "#b7d9f8",
  backgroundInputDisabled: "#f8f8f8",
  backgroundButtonHover: "#ffffff17",
  backgroundButtonPressed: "#0000001c",
  backgroundButtonDisabled: "#dfe3e6",
  backgroundItemCurrent: "#0081f1",
  backgroundItemCurrentChild: "#e1f0ff",
  backgroundItemCurrentHidden: "#7e868c",
  backgroundTooltipMain: "#11181c",
  backgroundTooltipDesigner: "#ffffff",
  backgroundSpacingTopBottom: "#f1f3f5",
  backgroundSpacingLeftRight: "#eceef0",
  backgroundSpacingHover: "#d7dbdf",
  backgroundProjectCardFront: "linear-gradient(0deg, #fbf8ff 25%, #e2e2e2 66%)",
  backgroundProjectCardBack: "linear-gradient(0deg, #fbf8ff 0%, #c7c7c7 100%)",
  backgroundProjectCardTextArea: "#ffffffe6",
  backgroundPublishedMain: "#39fbbb",
  backgroundPublishedContrast: "#ebfffc",
  borderMain: "#c1c8cd",
  borderFocus: "#0081f1",
  borderMenuInner: "#fcfcfc",
  borderColorSwatch: "#687076",
  borderNeutral: "#e8e8e8",
  borderSuccess: "#30a46c",
  borderAlert: "#f5d90a",
  borderInfo: "#0091ff",
  borderContrast: "#ffffff",
  borderPublished: "#ebfffc",
  borderItemChildLine: "#889096",
  borderItemChildLineCurrent: "#96c7f2",
  borderSetMain: "#b7d9f8",
  borderSetFlexUi: "#0091ff",
  borderInheritedMain: "#ffcca7",
  borderInheritedFlexUi: "#fa934e",
  borderDestructiveMain: "#dc3d43",
  borderDestructiveNotification: "#f9c6c6",
  foregroundMain: "#11181c",
  foregroundSubtle: "#7e868c",
  foregroundCategoryLabel: "#889096",
  foregroundSpacing: "#687076",
  foregroundDestructive: "#dc3d43",
  foregroundSuccess: "#30a46c",
  foregroundInfo: "#006adc",
  foregroundDisabled: "#c1c8cd",
  foregroundHiddenItem: "#7e868c",
  foregroundPublished: "#005406",
  foregroundFlexUiMain: "#c7c7c7",
  foregroundFlexUiHover: "#96c7f2",
  foregroundContrastMain: "#ffffff",
  foregroundContrastSubtle: "#c1c8cd",
  foregroundSetMain: "#006adc",
  foregroundSetFlexUi: "#0091ff",
  foregroundInheritedMain: "#bd4b00",
  foregroundInheritedFlexUi: "#fa934e",
  maintenanceLight: "#ededed",
  maintenanceMedium: "#c7c7c7",
  maintenanceDark: "#858585",
  maintenanceSpacerViz: "#f9c6c6",
} as const;

export const other = { tokenSetOrder0: "global" } as const;
