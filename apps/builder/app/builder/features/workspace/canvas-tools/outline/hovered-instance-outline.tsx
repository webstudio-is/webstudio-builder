import { useStore } from "@nanostores/react";
import {
  hoveredInstanceSelectorStore,
  hoveredInstanceOutlineStore,
  selectedInstanceSelectorStore,
} from "~/shared/nano-states";
import { textEditingInstanceSelectorStore } from "~/shared/nano-states/instances";
import { areInstanceSelectorsEqual } from "~/shared/tree-utils";
import { Outline } from "./outline";
import { Label } from "./label";

export const HoveredInstanceOutline = () => {
  const selectedInstanceSelector = useStore(selectedInstanceSelectorStore);
  const hoveredInstanceSelector = useStore(hoveredInstanceSelectorStore);
  const instanceOutline = useStore(hoveredInstanceOutlineStore);
  const textEditingInstanceSelector = useStore(
    textEditingInstanceSelectorStore
  );

  const isEditingText = textEditingInstanceSelector !== undefined;
  const isHoveringSelectedInstance = areInstanceSelectorsEqual(
    selectedInstanceSelector,
    hoveredInstanceSelector
  );

  if (
    instanceOutline === undefined ||
    isHoveringSelectedInstance ||
    isEditingText
  ) {
    return null;
  }

  return (
    <Outline rect={instanceOutline.rect}>
      <Label instance={instanceOutline} instanceRect={instanceOutline.rect} />
    </Outline>
  );
};
