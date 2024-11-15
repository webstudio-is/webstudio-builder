import type { Meta, StoryFn } from "@storybook/react";
import {
  Command as CommandComponent,
  CommandGroup,
  CommandGroupHeading,
  CommandIcon,
  CommandInput,
  CommandItem,
  CommandList,
  useSelectedAction,
} from "./command";
import { Text } from "./text";
import { InfoCircleIcon } from "@webstudio-is/icons";
import { Kbd } from "./kbd";
import { Flex } from "./flex";

const meta: Meta = {
  title: "Library/Command",
};
export default meta;

const CommandContent = () => {
  const action = useSelectedAction();
  return (
    <>
      <CommandInput />
      <CommandList>
        <CommandGroup
          heading={<CommandGroupHeading>Suggestions</CommandGroupHeading>}
          name="suggestions"
          actions={["select", "edit", "delete"]}
        >
          <CommandItem onSelect={() => console.log(action, "Calendar")}>
            <Flex gap={2}>
              <CommandIcon>
                <InfoCircleIcon />
              </CommandIcon>
              <Text variant="labelsTitleCase">Calendar</Text>
            </Flex>
          </CommandItem>
          <CommandItem>
            <Flex gap={2}>
              <CommandIcon>
                <InfoCircleIcon />
              </CommandIcon>
              <Text variant="labelsTitleCase">Search Emoji</Text>
            </Flex>
          </CommandItem>
          <CommandItem>
            <Flex gap={2}>
              <CommandIcon>
                <InfoCircleIcon />
              </CommandIcon>
              <Text variant="labelsTitleCase">Calculator</Text>
            </Flex>
          </CommandItem>
        </CommandGroup>
        <CommandGroup
          heading={<CommandGroupHeading>Settings</CommandGroupHeading>}
          name="settings"
          actions={["open"]}
        >
          <CommandItem>
            <Flex gap={2}>
              <CommandIcon>
                <InfoCircleIcon />
              </CommandIcon>
              <Text variant="labelsTitleCase">Profile</Text>
            </Flex>
            <Kbd value={["cmd", "p"]} />
          </CommandItem>
          <CommandItem>
            <Flex gap={2}>
              <CommandIcon>
                <InfoCircleIcon />
              </CommandIcon>
              <Text variant="labelsTitleCase">Billing</Text>
            </Flex>
            <Kbd value={["cmd", "b"]} />
          </CommandItem>
          <CommandItem>
            <Flex gap={2}>
              <CommandIcon>
                <InfoCircleIcon />
              </CommandIcon>
              <Text variant="labelsTitleCase">Settings</Text>
            </Flex>
            <Kbd value={["cmd", "s"]} />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  );
};

export const Command: StoryFn = () => {
  return (
    <CommandComponent>
      <CommandContent />
    </CommandComponent>
  );
};
