import { sync } from "immerhin";
import type { Build, Project } from "@webstudio-is/project";
import type { Tree } from "@webstudio-is/project-build";
import { restPatchPath } from "~/shared/router-utils";
import { useEffect } from "react";
import { enqueue, dequeue, state } from "./queue";
import { useBeforeUnload } from "react-use";

// Periodic check for new entries to group them into one job/call in sync queue.
const NEW_ENTRIES_INTERVAL = 1000;

// First attempts we will simply retry without changing the state or notifying anyone.
const INTERVAL_RECOVERY = 2000;

// When we reached max failed attempts we will slow down the attempts interval.
const INTERVAL_ERROR = 5000;

const useRecoveryCheck = () => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (state.status.get() === "recovering") {
        dequeue();
      }
    }, INTERVAL_RECOVERY);

    return () => clearInterval(intervalId);
  }, []);
};

const useErrorCheck = () => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (state.status.get() === "error") {
        dequeue();
      }
    }, INTERVAL_ERROR);

    return () => clearInterval(intervalId);
  }, []);
};

const useNewEntriesCheck = ({
  treeId,
  buildId,
  projectId,
}: UserSyncServerProps) => {
  useEffect(() => {
    // @todo setInterval can be completely avoided.
    // Right now prisma can't do atomic updates yet with sandbox documents
    // and backend fetches and updates big objects, so if we send quickly,
    // we end up overwriting things
    const intervalId = setInterval(() => {
      const transactions = sync();

      if (transactions.length === 0) {
        return;
      }

      enqueue(() =>
        fetch(restPatchPath(), {
          method: "post",
          body: JSON.stringify({
            transactions,
            treeId,
            buildId,
            projectId,
          }),
        })
      );
    }, NEW_ENTRIES_INTERVAL);

    return () => clearInterval(intervalId);
  }, [treeId, buildId]);
};

type UserSyncServerProps = {
  buildId: Build["id"];
  treeId: Tree["id"];
  projectId: Project["id"];
};

export const useSyncServer = (props: UserSyncServerProps) => {
  useNewEntriesCheck(props);
  useRecoveryCheck();
  useErrorCheck();
  useBeforeUnload(
    () => state.status.get() !== "idle",
    "You have unsaved changes. Are you sure you want to leave?"
  );
};
