import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Flex,
  Separator,
  Text,
  TooltipProvider,
  css,
  globalCss,
  theme,
} from "@webstudio-is/design-system";
import type { DashboardProject } from "@webstudio-is/dashboard";
import { ProfileMenu } from "./profile-menu";
import { Projects, Templates } from "./projects";
import type { User } from "~/shared/db/user.server";
import type { UserPlanFeatures } from "~/shared/db/user-plan-features.server";
import { NavLink, useLocation, useRevalidator } from "@remix-run/react";
import { CloneProjectDialog } from "~/shared/clone-project";
import { Toaster } from "@webstudio-is/design-system";
import {
  BodyIcon,
  ContentIcon,
  DiscordIcon,
  ExtensionIcon,
  LifeBuoyIcon,
  Youtube1cIcon,
} from "@webstudio-is/icons";

const globalStyles = globalCss({
  html: {
    display: "grid",
    minHeight: "100%",
  },
  body: {
    margin: 0,
    background: theme.colors.backgroundPanel,
  },
});

const Main = (props: ComponentProps<typeof Flex>) => {
  return <Flex {...props} as="main" direction="column" gap="5" grow />;
};

const Section = (props: ComponentProps<typeof Flex>) => {
  return (
    <Flex
      {...props}
      justify="center"
      as="section"
      css={{ minWidth: theme.spacing[33] }}
    />
  );
};

export type DashboardProps = {
  user: User;
  projects?: Array<DashboardProject>;
  templates?: Array<DashboardProject>;
  userPlanFeatures: UserPlanFeatures;
  publisherHost: string;
  projectToClone?: {
    authToken: string;
    id: string;
    title: string;
  };
};

const CloneProject = ({
  projectToClone,
}: {
  projectToClone: DashboardProps["projectToClone"];
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(projectToClone !== undefined);
  const { revalidate } = useRevalidator();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const cloneProjectAuthToken = searchParams.get("projectToCloneAuthToken");
    if (cloneProjectAuthToken === null) {
      return;
    }

    // Use the native history API to remove query parameters without reloading the page data
    const currentState = window.history.state;
    window.history.replaceState(currentState, "", location.pathname);
  }, [location.search, location.pathname]);

  return projectToClone !== undefined ? (
    <CloneProjectDialog
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      project={{
        id: projectToClone.id,
        title: projectToClone.title,
      }}
      authToken={projectToClone.authToken}
      onCreate={() => {
        revalidate();
      }}
    />
  ) : undefined;
};

const sidebarLinkStyle = css({
  all: "unset",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing[5],
  height: theme.spacing[13],
  paddingInline: theme.panel.paddingInline,
  outline: "none",
  "&:focus-visible, &:hover": {
    background: theme.colors.backgroundHover,
  },
  "&[aria-current=page]": {
    background: theme.colors.backgroundItemCurrent,
    color: theme.colors.foregroundMain,
  },
});

const SidebarLink = ({
  to,
  prefix,
  children,
  target,
}: {
  prefix: ReactNode;
  children: string;
  to: string;
  target?: string;
}) => {
  return (
    <NavLink to={to} end target={target} className={sidebarLinkStyle()}>
      {prefix}
      <Text variant="labelsSentenceCase">{children}</Text>
    </NavLink>
  );
};

export const Dashboard = ({
  user,
  projects,
  templates,
  userPlanFeatures,
  publisherHost,
  projectToClone,
}: DashboardProps) => {
  globalStyles();

  return (
    <TooltipProvider>
      <Flex css={{ height: "100%" }}>
        <Flex
          as="aside"
          align="stretch"
          direction="column"
          css={{
            width: theme.sizes.sidebarWidth,
            borderRight: `1px solid ${theme.colors.borderMain}`,
          }}
        >
          <Flex
            as="header"
            align="center"
            justify="between"
            css={{
              paddingInline: theme.spacing[3],
              paddingBlock: theme.spacing[8],
            }}
          >
            <ProfileMenu user={user} userPlanFeatures={userPlanFeatures} />
          </Flex>
          <SidebarLink to="/dashboard" prefix={<BodyIcon />}>
            Projects
          </SidebarLink>
          <SidebarLink to="/dashboard/templates" prefix={<ExtensionIcon />}>
            Starter templates
          </SidebarLink>
          <Flex direction="column">
            <Separator css={{ marginBlock: theme.spacing[5] }} />
            <SidebarLink
              to="https://wstd.us/101"
              target="_blank"
              prefix={<Youtube1cIcon fill="black" />}
            >
              Video tutorials
            </SidebarLink>
            <SidebarLink
              to="https://help.webstudio.is/"
              target="_blank"
              prefix={<LifeBuoyIcon />}
            >
              Support hub
            </SidebarLink>
            <SidebarLink
              to="https://docs.webstudio.is"
              target="_blank"
              prefix={<ContentIcon />}
            >
              Docs
            </SidebarLink>
            <SidebarLink
              to="https://wstd.us/community"
              target="_blank"
              prefix={<DiscordIcon fill="black" />}
            >
              Community
            </SidebarLink>
          </Flex>
        </Flex>
        <Main>
          <Section>
            {projects && (
              <Projects
                projects={projects}
                hasProPlan={userPlanFeatures.hasProPlan}
                publisherHost={publisherHost}
              />
            )}
            {templates && (
              <Templates templates={templates} publisherHost={publisherHost} />
            )}
          </Section>
        </Main>
      </Flex>
      <CloneProject projectToClone={projectToClone} />
      <Toaster />
    </TooltipProvider>
  );
};
