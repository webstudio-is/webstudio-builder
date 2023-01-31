import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
  css,
  Flex,
  Text,
  theme,
} from "@webstudio-is/design-system";
import { MenuIcon } from "@webstudio-is/icons";
import type { DashboardProject } from "@webstudio-is/prisma-client";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { designerPath, getPublishedUrl } from "~/shared/router-utils";
import { Link as RemixLink } from "@remix-run/react";
import { isFeatureEnabled } from "@webstudio-is/feature-flags";
import {
  RenameProject,
  DeleteProject,
  useDuplicate,
} from "./create-rename-duplicate-delete";

const containerStyle = css({
  overflow: "hidden",
  width: theme.spacing[31],
  height: theme.spacing[29],
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: theme.colors.borderMain,
  borderRadius: theme.borderRadius[4],
  background: theme.colors.brandBackgroundProjectCardBack,
  "&:hover, &:focus-within": {
    boxShadow: theme.shadows.brandElevationBig,
  },
});

// @todo use typography from figma tokens
const thumbnailStyle = css({
  display: "flex",
  alignItems: "center",
  alignSelf: "center",
  minHeight: 0,
  fontFamily: theme.fonts.manrope,
  fontWeight: 200,
  fontSize: 360,
  letterSpacing: "-0.05em",
  background: theme.colors.brandBackgroundProjectCardFront,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  userSelect: "none",
  outline: "none",
  "&:hover, &:focus": {
    fontWeight: 800,
    transition: "100ms",
  },
});

const footerStyle = css({
  background: theme.colors.brandBackgroundProjectCardTextArea,
  height: theme.spacing[17],
  py: theme.spacing[5],
  px: theme.spacing[7],
});

const usePublishedLink = ({ domain }: { domain: string }) => {
  const [url, setUrl] = useState<URL>();

  useEffect(() => {
    // It uses `window.location` to detect the default values when running locally localhost,
    // so it needs an effect to avoid hydration errors.
    setUrl(new URL(getPublishedUrl(domain)));
  }, [domain]);

  return { url };
};

const PublishedLink = ({
  domain,
  tabIndex,
}: {
  domain: string;
  tabIndex: number;
}) => {
  const { url } = usePublishedLink({ domain });
  return (
    <Text
      as="a"
      href={url?.href}
      target="_blank"
      truncate
      color="hint"
      tabIndex={tabIndex}
      css={{
        "&:not(:hover)": {
          textDecoration: "none",
        },
      }}
    >
      {url?.host}
    </Text>
  );
};

const Menu = ({
  tabIndex,
  onDelete,
  onRename,
  onDuplicate,
}: {
  tabIndex: number;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <IconButton
          variant={isOpen ? "active" : "default"}
          aria-label="Menu Button"
          tabIndex={tabIndex}
          css={{ alignSelf: "center" }}
        >
          <MenuIcon width={15} height={15} />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onDuplicate}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onSelect={onRename}>Rename</DropdownMenuItem>
        {isFeatureEnabled("share2") && (
          <DropdownMenuItem>Share</DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const useProjectCard = () => {
  const thumbnailRef = useRef<HTMLAnchorElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const elements: Array<HTMLElement> = Array.from(
      event.currentTarget.querySelectorAll(`[tabIndex='-1']`)
    );
    const currentIndex = elements.indexOf(
      document.activeElement as HTMLElement
    );
    switch (event.key) {
      case "Enter": {
        // Only open project on enter when the project card container was focused,
        // otherwise we will always open project, even when a menu was pressed.
        if (event.currentTarget === document.activeElement) {
          thumbnailRef.current?.click();
        }
        break;
      }
      case "ArrowUp":
      case "ArrowRight": {
        const nextElement = elements.at(currentIndex + 1) ?? elements[0];
        nextElement?.focus();
        break;
      }
      case "ArrowDown":
      case "ArrowLeft": {
        const nextElement = elements.at(currentIndex - 1) ?? elements[0];
        nextElement?.focus();
        break;
      }
    }
  };

  return {
    thumbnailRef,
    handleKeyDown,
  };
};

// My Next Project > MN
const getThumbnailAbbreviation = (title: string) =>
  title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

type ProjectCardProps = Pick<
  DashboardProject,
  "id" | "title" | "domain" | "isPublished"
>;

export const ProjectCard = ({
  id,
  title,
  domain,
  isPublished,
}: ProjectCardProps) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { thumbnailRef, handleKeyDown } = useProjectCard();
  const handleDuplicate = useDuplicate(id);

  return (
    <>
      <Flex
        direction="column"
        shrink={false}
        as="article"
        className={containerStyle()}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <RemixLink
          ref={thumbnailRef}
          to={designerPath({ projectId: id })}
          className={thumbnailStyle()}
          tabIndex={-1}
        >
          {getThumbnailAbbreviation(title)}
        </RemixLink>
        <Flex
          justify="between"
          shrink={false}
          gap="1"
          className={footerStyle()}
        >
          <Flex direction="column" justify="around">
            <Text variant="title" truncate>
              {title}
            </Text>
            {isPublished ? (
              <PublishedLink domain={domain} tabIndex={-1} />
            ) : (
              <Text color="hint">Not Published</Text>
            )}
          </Flex>
          <Menu
            tabIndex={-1}
            onDelete={() => {
              setIsDeleteDialogOpen(true);
            }}
            onRename={() => {
              setIsRenameDialogOpen(true);
            }}
            onDuplicate={handleDuplicate}
          />
        </Flex>
      </Flex>
      <RenameProject
        isOpen={isRenameDialogOpen}
        title={title}
        projectId={id}
        onComplete={() => {
          setIsRenameDialogOpen(false);
        }}
        onOpenChange={setIsRenameDialogOpen}
      />
      <DeleteProject
        isOpen={isDeleteDialogOpen}
        title={title}
        projectId={id}
        onComplete={() => {
          setIsDeleteDialogOpen(false);
        }}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
};
