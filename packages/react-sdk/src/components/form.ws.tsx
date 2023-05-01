import { FormIcon } from "@webstudio-is/icons";
import { form } from "../css/normalize";
import type {
  PresetStyle,
  WsComponentMeta,
  WsComponentPropsMeta,
} from "./component-meta";
import type { defaultTag } from "./form";
import { props } from "./__generated__/form.props";

const presetStyle = {
  form: [
    ...form,
    { property: "minHeight", value: { type: "unit", unit: "px", value: 20 } },
  ],
} satisfies PresetStyle<typeof defaultTag>;

export const meta: WsComponentMeta = {
  category: "forms",
  type: "container",
  label: "Form",
  Icon: FormIcon,
  presetStyle,
  children: [
    {
      type: "instance",
      component: "Label",
      children: [{ type: "text", value: "Name" }],
    },
    {
      type: "instance",
      component: "Input",
      props: [{ type: "string", name: "name", value: "name" }],
      children: [],
    },
    {
      type: "instance",
      component: "Label",
      children: [{ type: "text", value: "Email" }],
    },
    {
      type: "instance",
      component: "Input",
      props: [{ type: "string", name: "email", value: "email" }],
      children: [],
    },
    {
      type: "instance",
      component: "Button",
      children: [{ type: "text", value: "Submit" }],
    },
  ],
};

export const propsMeta: WsComponentPropsMeta = {
  props,
  initialProps: [],
};
