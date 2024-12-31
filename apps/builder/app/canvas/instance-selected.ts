import { type Instance } from "@webstudio-is/sdk";
import { selectorIdAttribute } from "@webstudio-is/react-sdk";
import { subscribeWindowResize } from "~/shared/dom-hooks";
import {
  $isResizingCanvas,
  $selectedInstanceRenderState,
  $stylesIndex,
  $instances,
  $selectedInstanceSelector,
  $propValuesByInstanceSelectorWithMemoryProps,
  $styles,
  $selectedInstanceStates,
  $styleSourceSelections,
} from "~/shared/nano-states";
import {
  getAllElementsBoundingBox,
  getVisibleElementsByInstanceSelector,
  getAllElementsByInstanceSelector,
  scrollIntoView,
  hasDoNotTrackMutationRecord,
} from "~/shared/dom-utils";
import { subscribeScrollState } from "~/canvas/shared/scroll-state";
import { $selectedInstanceOutline } from "~/shared/nano-states";
import {
  hasCollapsedMutationRecord,
  setDataCollapsed,
} from "~/canvas/collapsed";
import type { InstanceSelector } from "~/shared/tree-utils";
import { shallowEqual } from "shallow-equal";
import warnOnce from "warn-once";

const setOutline = (instanceId: Instance["id"], elements: HTMLElement[]) => {
  $selectedInstanceOutline.set({
    instanceId,
    rect: getAllElementsBoundingBox(elements),
  });
};

const hideOutline = () => {
  $selectedInstanceOutline.set(undefined);
};

const subscribeSelectedInstance = (
  selectedInstanceSelector: Readonly<InstanceSelector>,
  debounceEffect: (callback: () => void) => void
) => {
  if (selectedInstanceSelector.length === 0) {
    return;
  }

  const instanceId = selectedInstanceSelector[0];

  let visibleElements = getVisibleElementsByInstanceSelector(
    selectedInstanceSelector
  );

  const updateScroll = () => {
    const bbox = getAllElementsBoundingBox(visibleElements);
    if (visibleElements.length === 0) {
      return;
    }
    scrollIntoView(visibleElements[0], bbox);
  };

  const updateElements = () => {
    visibleElements = getVisibleElementsByInstanceSelector(
      selectedInstanceSelector
    );
  };

  const updateDataCollapsed = () => {
    if (visibleElements.length === 0) {
      return;
    }

    for (const element of visibleElements) {
      const selectorId = element.getAttribute(selectorIdAttribute);
      if (selectorId === null) {
        continue;
      }

      const instanceSelector = selectorId.split(",");
      if (instanceSelector.length === 0) {
        continue;
      }

      setDataCollapsed(instanceSelector[0], false);
    }

    // Synchronously execute setDataCollapsed to calculate right outline
    // This fixes an issue, when new element outline was calculated before collapsed elements calculations
    setDataCollapsed(instanceId, true);
  };

  updateDataCollapsed();

  const showOutline = () => {
    if ($isResizingCanvas.get()) {
      return;
    }
    setOutline(instanceId, visibleElements);
  };
  // effect close to rendered element also catches dnd remounts
  // so actual state is always provided here
  showOutline();

  const updateStores = () => {
    const elements = getAllElementsByInstanceSelector(selectedInstanceSelector);

    if (elements.length === 0) {
      return;
    }

    const [element] = elements;

    const availableStates = new Set<string>();
    const instanceStyleSourceIds = new Set(
      $styleSourceSelections.get().get(instanceId)?.values
    );
    const styles = $styles.get();
    for (const styleDecl of styles.values()) {
      if (
        instanceStyleSourceIds.has(styleDecl.styleSourceId) &&
        styleDecl.state
      ) {
        availableStates.add(styleDecl.state);
      }
    }
    const activeStates = new Set<string>();
    for (const state of availableStates) {
      try {
        // pseudo classes like :open or :current are not supported in .matches method
        if (element.matches(state)) {
          activeStates.add(state);
        }
      } catch {
        warnOnce(true, `state selector "${state}" is invalid`);
      }
    }

    if (
      !shallowEqual(activeStates.keys(), $selectedInstanceStates.get().keys())
    ) {
      $selectedInstanceStates.set(activeStates);
    }
  };

  let updateStoreTimeouHandle: undefined | ReturnType<typeof setTimeout>;

  const update = () => {
    debounceEffect(() => {
      updateElements();
      // Having hover etc, element can have no size because of that
      // Newly created element can have 0 size
      updateDataCollapsed();
      // contentRect has wrong x/y values for absolutely positioned element.
      // getBoundingClientRect is used instead.
      showOutline();

      updateStores();

      // Having that elements can be changed (i.e. div => address tag change, observe again)
      updateObservers();

      // update scroll state
      updateScroll();
    });
  };

  // Lightweight update
  const updateOutline: MutationCallback = (mutationRecords) => {
    if (hasCollapsedMutationRecord(mutationRecords)) {
      return;
    }

    showOutline();
  };

  const resizeObserver = new ResizeObserver(update);

  const mutationHandler: MutationCallback = (mutationRecords) => {
    if (hasDoNotTrackMutationRecord(mutationRecords)) {
      return;
    }

    if (hasCollapsedMutationRecord(mutationRecords)) {
      return;
    }

    update();
  };

  // detect movement of the element within same parent
  // React prevent remount when key stays the same
  // `attributes: true` fixes issues with popups after trigger text editing
  // that cause radix to incorrectly set content in a wrong position at first render
  const mutationObserver = new MutationObserver(mutationHandler);

  const updateObservers = () => {
    for (const element of visibleElements) {
      resizeObserver.observe(element);

      const parent = element?.parentElement;

      if (parent) {
        mutationObserver.observe(parent, {
          childList: true,
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ["style", "class"],
        });
      }
    }
  };

  const bodyStyleMutationObserver = new MutationObserver(updateOutline);

  // previewStyle variables
  bodyStyleMutationObserver.observe(document.body, {
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ["style", "class"],
  });

  updateObservers();

  const unsubscribe$stylesIndex = $stylesIndex.subscribe(update);
  const unsubscribe$instances = $instances.subscribe(update);
  const unsubscribePropValuesStore =
    $propValuesByInstanceSelectorWithMemoryProps.subscribe(update);

  const unsubscribeIsResizingCanvas = $isResizingCanvas.subscribe(
    (isResizing) => {
      if (isResizing && $selectedInstanceOutline.get()) {
        return hideOutline();
      }
      showOutline();
    }
  );

  const unsubscribeScrollState = subscribeScrollState({
    onScrollStart() {
      hideOutline();
    },
    onScrollEnd() {
      showOutline();
    },
  });

  const unsubscribeWindowResize = subscribeWindowResize({
    onResizeStart() {
      hideOutline();
    },
    onResizeEnd() {
      showOutline();
    },
  });

  $selectedInstanceRenderState.set("mounted");

  return () => {
    clearTimeout(updateStoreTimeouHandle);
    hideOutline();
    $selectedInstanceRenderState.set("notMounted");
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    bodyStyleMutationObserver.disconnect();
    unsubscribeIsResizingCanvas();
    unsubscribeScrollState();
    unsubscribeWindowResize();
    unsubscribe$stylesIndex();
    unsubscribe$instances();
    unsubscribePropValuesStore();
  };
};

export const subscribeSelected = (
  debounceEffect: (callback: () => void) => void
) => {
  let previousSelectedInstance: readonly string[] | undefined = undefined;
  let unsubscribeSelectedInstance = () => {};

  const unsubscribe = $selectedInstanceSelector.subscribe(
    (instanceSelector) => {
      if (instanceSelector !== previousSelectedInstance) {
        unsubscribeSelectedInstance();
        unsubscribeSelectedInstance =
          subscribeSelectedInstance(instanceSelector ?? [], debounceEffect) ??
          (() => {});
        previousSelectedInstance = instanceSelector;
      }
    }
  );

  return () => {
    unsubscribe();
    unsubscribeSelectedInstance();
  };
};
