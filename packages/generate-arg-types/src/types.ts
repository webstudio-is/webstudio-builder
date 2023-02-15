import { z } from "zod";

// We're trying to have the same API as Storybook's ArgTypes here
// https://storybook.js.org/docs/react/api/argtypes
// https://github.com/ComponentDriven/csf/blob/next/src/story.ts#L63
//
// And have the same list of controls as Storybook (with some additions)
// https://storybook.js.org/docs/react/essentials/controls

const dataType = <T extends string>(name: T) =>
  z.object({ name: z.literal(name), required: z.boolean() });

const controlType = <T extends string>(name: T) =>
  z.union([z.literal(name), z.object({ type: z.literal(name) })]);

const controlTypeWithOptions = <T extends string>(name: T) =>
  z.object({ type: z.literal(name), options: z.array(z.string()) });

const common = {
  /**
   * Label for the control (may not match the property name)
   */
  name: z.string(),
  description: z.string().nullable(),
};

const Number = z.object({
  ...common,
  type: dataType("number"),
  control: controlType("number"),
  defaultValue: z.number().nullable(),
});

const Range = z.object({
  ...common,
  type: dataType("number"),
  control: controlType("range"),
  defaultValue: z.number().nullable(),
});

const Text = z.object({
  ...common,
  type: z.object({
    // we don't specify a supported type here,
    // because we use Text as a fallback control for all sorts of types
    // for example: `boolean | "true" | "false" | "grammar" | "spelling"`
    name: z.string(),
    required: z.boolean(),
  }),
  control: controlType("text"),
  defaultValue: z.string().nullable(),
});

// Discussed with Storybook team here:
// https://discord.com/channels/486522875931656193/689023212519948302/1075001187776069682
// https://github.com/storybookjs/storybook/issues/21100
const MultilineText = z.object({
  ...common,
  type: dataType("string"),
  control: controlType("multiline-text"),
  defaultValue: z.string().nullable(),
});

const Color = z.object({
  ...common,
  type: dataType("string"),
  control: controlType("color"),
  defaultValue: z.string().nullable(),
});

const Boolean = z.object({
  ...common,
  type: dataType("boolean"),
  control: controlType("boolean"),
  defaultValue: z.boolean().nullable(),
});

const Radio = z.object({
  ...common,
  type: dataType("string"),
  control: controlTypeWithOptions("radio"),
  defaultValue: z.string().nullable(),
});

const InlineRadio = z.object({
  ...common,
  type: dataType("string"),
  control: controlTypeWithOptions("inline-radio"),
  defaultValue: z.string().nullable(),
});

const Select = z.object({
  ...common,
  type: dataType("string"),
  control: controlTypeWithOptions("select"),
  defaultValue: z.string().nullable(),
});

const MultiSelect = z.object({
  ...common,
  type: dataType("string[]"),
  control: controlTypeWithOptions("multi-select"),
  defaultValue: z.array(z.string()).nullable(),
});

const Check = z.object({
  ...common,
  type: dataType("string[]"),
  control: controlTypeWithOptions("check"),
  defaultValue: z.array(z.string()).nullable(),
});

const InlineCheck = z.object({
  ...common,
  type: dataType("string[]"),
  control: controlTypeWithOptions("inline-check"),
  defaultValue: z.array(z.string()).nullable(),
});

// @todo
// remove this and add a generic "file" control instead with an "accept" option
// to be in line with Storybook
const FileImage = z.object({
  ...common,
  type: dataType("string"),
  control: controlType("file-image"),
  defaultValue: z.string().nullable(),
});

// we neither generate object nor support it in props panel, listed here for completeness
const Object = z.object({
  ...common,
  type: z.object({
    name: z.string(), // @todo not sure what type should be here
    required: z.boolean(),
  }),
  control: controlType("object"),
  defaultValue: z.any().nullable(), // @todo maybe z.record(z.any())?
  ...common,
});

// we neither generate date nor support it in props panel, listed here for completeness
const Date = z.object({
  ...common,
  type: dataType("string"), // @todo not sure we should use string here and for defaultValue
  control: controlType("date"),
  defaultValue: z.string().nullable(),
  ...common,
});

export const PropMeta = z.union([
  Number,
  Range,
  Text,
  MultilineText,
  Color,
  Boolean,
  Radio,
  InlineRadio,
  Select,
  MultiSelect,
  Check,
  InlineCheck,
  FileImage,
  Object,
  Date,
]);

export type PropMeta = z.infer<typeof PropMeta>;
