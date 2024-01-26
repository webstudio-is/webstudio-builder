import { useStore } from "@nanostores/react";
import {
  theme,
  css,
  Flex,
  Toolbar,
  ToolbarToggleGroup,
  ToolbarButton,
} from "@webstudio-is/design-system";
import type { Project } from "@webstudio-is/project";
import { $selectedPage } from "~/shared/nano-states";
import { PreviewButton } from "./preview";
import { ShareButton } from "./share";
import { PublishButton } from "./publish";
import { SyncStatus } from "./sync-status";
import { Menu } from "./menu";
import {
  BreakpointsSelectorContainer,
  BreakpointsPopover,
} from "../breakpoints";
import { ViewMode } from "./view-mode";
import { $activeSidebarPanel } from "~/builder/shared/nano-states";

const topbarContainerStyle = css({
  display: "flex",
  background: theme.colors.backgroundTopbar,
  height: theme.spacing[15],
  boxShadow: `inset 0 -1px 0 0 ${theme.colors.panelOutline}`,
  paddingRight: theme.spacing[9],
  color: theme.colors.foregroundContrastMain,
});

type TopbarProps = {
  gridArea: string;
  project: Project;
  hasProPlan: boolean;
};

export const Topbar = ({ gridArea, project, hasProPlan }: TopbarProps) => {
  const page = useStore($selectedPage);
  if (page === undefined) {
    return;
  }

  return (
    <nav className={topbarContainerStyle({ css: { gridArea } })}>
      <Flex grow={false} shrink={false}>
        <Menu />
      </Flex>
      <Flex align="center">
        <ToolbarButton
          css={{
            px: theme.spacing[9],
            maxWidth: theme.spacing[24],
          }}
          aria-label="Toggle Pages"
          onClick={() => {
            $activeSidebarPanel.set(
              $activeSidebarPanel.get() === "pages" ? "none" : "pages"
            );
          }}
          tabIndex={0}
        >
          {page.name}
        </ToolbarButton>
      </Flex>
      <Flex css={{ minWidth: theme.spacing[23] }}>
        <BreakpointsPopover />
      </Flex>
      <Flex grow align="center" justify="center">
        <BreakpointsSelectorContainer />
      </Flex>
      <Toolbar>
        <ToolbarToggleGroup
          type="single"
          css={{
            justifyContent: "flex-end",
            gap: theme.spacing[5],
            width: theme.spacing[30],
          }}
        >
          <ViewMode />
          <SyncStatus />
          <PreviewButton />
          <ShareButton projectId={project.id} hasProPlan={hasProPlan} />
          <PublishButton projectId={project.id} />
        </ToolbarToggleGroup>
      </Toolbar>
    </nav>
  );
};
