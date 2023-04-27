import { CheckboxCheckedFilledIcon } from "@webstudio-is/icons";
import type {
  WsComponentMeta,
  WsComponentPropsMeta,
  PresetStyle,
} from "./component-meta";
import type { defaultTag } from "./checkbox";
import { input } from "../css/normalize";
import { props } from "./__generated__/checkbox.props";

const presetStyle = {
  input,
} satisfies PresetStyle<typeof defaultTag>;

export const meta: WsComponentMeta = {
  type: "control",
  label: "Checkbox",
  Icon: CheckboxCheckedFilledIcon,
  presetStyle,
  states: [
    { selector: ":checked", label: "Checked" },
    { selector: ":hover", label: "Hover" },
    { selector: ":focus", label: "Focus" },
    { selector: ":required", label: "Required" },
    { selector: ":optional", label: "Optional" },
    { selector: ":disabled", label: "Disabled" },
    { selector: ":enabled", label: "Enabled" },
    { selector: ":read-only", label: "Read Only" },
    { selector: ":read-write", label: "Read Write" },
  ],
};

export const propsMeta: WsComponentPropsMeta = {
  props,
  initialProps: ["name"],
};
