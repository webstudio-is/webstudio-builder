import { useEffect } from "react";
import store from "immerhin";
import type { Instance } from "@webstudio-is/project-build";
import { utils } from "@webstudio-is/project";
import { useSubscribe } from "~/shared/pubsub";
import {
  rootInstanceContainer,
  selectedInstanceIdStore,
  useTextEditingInstanceId,
} from "~/shared/nano-states";
import { publish } from "~/shared/pubsub";

declare module "~/shared/pubsub" {
  export interface PubsubMap {
    textEditingInstanceId?: Instance["id"];
    insertInstance: {
      instance: Instance;
      dropTarget?: { parentId: Instance["id"]; position: number | "end" };
    };
  }
}

export const useInsertInstance = () => {
  useSubscribe("insertInstance", ({ instance, dropTarget }) => {
    store.createTransaction([rootInstanceContainer], (rootInstance) => {
      if (rootInstance === undefined) {
        return;
      }
      utils.tree.insertInstanceMutable(rootInstance, instance, dropTarget);
    });
    selectedInstanceIdStore.set(instance.id);
  });
};

export const useReparentInstance = () => {
  useSubscribe("reparentInstance", ({ instanceId, dropTarget }) => {
    const selectedInstanceId = selectedInstanceIdStore.get();
    store.createTransaction([rootInstanceContainer], (rootInstance) => {
      if (rootInstance === undefined) {
        return;
      }
      utils.tree.reparentInstanceMutable(
        rootInstance,
        instanceId,
        dropTarget.instanceId,
        dropTarget.position
      );
    });

    const rootInstance = rootInstanceContainer.get();
    // Make the drag item the selected instance
    if (selectedInstanceId !== instanceId && rootInstance !== undefined) {
      selectedInstanceIdStore.set(instanceId);
    }
  });
};

export const usePublishTextEditingInstanceId = () => {
  const [editingInstanceId] = useTextEditingInstanceId();
  useEffect(() => {
    publish({
      type: "textEditingInstanceId",
      payload: editingInstanceId,
    });
  }, [editingInstanceId]);
};
