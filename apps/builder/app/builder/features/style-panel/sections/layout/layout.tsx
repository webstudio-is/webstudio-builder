import { useState } from "react";
import {
  Box,
  EnhancedTooltip,
  Flex,
  Grid,
  SmallToggleButton,
  ToggleButton,
  Tooltip,
} from "@webstudio-is/design-system";
import type { StyleProperty, StyleValue } from "@webstudio-is/css-data";
import { toValue } from "@webstudio-is/css-engine";
import {
  Link2Icon,
  Link2UnlinkedIcon,
  GapHorizontalIcon,
  GapVerticalIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  WrapIcon,
  NoWrapIcon,
} from "@webstudio-is/icons";
import type { RenderCategoryProps } from "../../style-sections";
import { FlexGrid } from "./shared/flex-grid";
import { MenuControl, SelectControl } from "../../controls";
import { PropertyName } from "../../shared/property-name";
import { styleConfigByName } from "../../shared/configs";
import type { CreateBatchUpdate } from "../../shared/use-style-data";
import {
  getStyleSource,
  type StyleInfo,
  type StyleValueInfo,
} from "../../shared/style-info";
import { CollapsibleSection } from "../../shared/collapsible-section";
import {
  type IntermediateStyleValue,
  CssValueInput,
} from "../../shared/css-value-input";
import { theme } from "@webstudio-is/design-system";
import { isFeatureEnabled } from "@webstudio-is/feature-flags";

const GapLinked = ({
  isLinked,
  onChange,
}: {
  isLinked: boolean;
  onChange: (isLinked: boolean) => void;
}) => (
  <Tooltip
    content={isLinked ? "Unlink gap values" : "Link gap values"}
    delayDuration={400}
    disableHoverableContent={true}
  >
    <SmallToggleButton
      pressed={isLinked}
      onPressedChange={onChange}
      variant="normal"
      icon={isLinked ? <Link2Icon /> : <Link2UnlinkedIcon />}
    />
  </Tooltip>
);

const GapInput = ({
  icon,
  style,
  property,
  intermediateValue,
  onIntermediateChange,
  onPreviewChange,
  onChange,
}: {
  icon: JSX.Element;
  style: StyleInfo;
  property: StyleProperty;
  intermediateValue?: StyleValue | IntermediateStyleValue;
  onIntermediateChange: (value?: StyleValue | IntermediateStyleValue) => void;
  onPreviewChange: (value?: StyleValue) => void;
  onChange: (value: StyleValue) => void;
}) => {
  const { label, items } = styleConfigByName(property);
  return (
    <EnhancedTooltip content={label}>
      <Box>
        <CssValueInput
          styleSource={getStyleSource(style[property])}
          icon={icon}
          property="columnGap"
          value={style[property]?.value}
          intermediateValue={intermediateValue}
          keywords={items.map((item) => ({
            type: "keyword",
            value: item.name,
          }))}
          onChange={(styleValue) => {
            onIntermediateChange(styleValue);
            if (styleValue === undefined) {
              onPreviewChange();
              return;
            }
            if (styleValue.type !== "intermediate") {
              onPreviewChange(styleValue);
            }
          }}
          onHighlight={(styleValue) => {
            if (styleValue !== undefined) {
              onPreviewChange(styleValue);
            } else {
              onPreviewChange();
            }
          }}
          onChangeComplete={({ value }) => {
            onChange(value);
            onIntermediateChange(undefined);
          }}
          onAbort={() => {
            onPreviewChange();
          }}
        />
      </Box>
    </EnhancedTooltip>
  );
};

const FlexGap = ({
  style,
  createBatchUpdate,
}: {
  style: StyleInfo;
  createBatchUpdate: CreateBatchUpdate;
}) => {
  const batchUpdate = createBatchUpdate();

  const [isLinked, setIsLinked] = useState(() => {
    return toValue(style.columnGap?.value) === toValue(style.rowGap?.value);
  });

  const [intermediateColumnGap, setIntermediateColumnGap] = useState<
    StyleValue | IntermediateStyleValue
  >();
  const [intermediateRowGap, setIntermediateRowGap] = useState<
    StyleValue | IntermediateStyleValue
  >();

  return (
    <Grid
      css={{
        gridTemplateColumns: "4fr 1fr 4fr",
        gridTemplateRows: "auto",
        gridTemplateAreas: `
          "columnGap linked rowGap"
        `,
        alignItems: "center",
      }}
    >
      <Box css={{ gridArea: "columnGap" }}>
        <GapInput
          icon={<GapHorizontalIcon />}
          style={style}
          property="columnGap"
          intermediateValue={intermediateColumnGap}
          onIntermediateChange={(value) => {
            setIntermediateColumnGap(value);
            if (isLinked) {
              setIntermediateRowGap(value);
            }
          }}
          onPreviewChange={(value) => {
            if (value === undefined) {
              batchUpdate.deleteProperty("columnGap");
              if (isLinked) {
                batchUpdate.deleteProperty("rowGap");
              }
            } else {
              batchUpdate.setProperty("columnGap")(value);
              if (isLinked) {
                batchUpdate.setProperty("rowGap")(value);
              }
            }
            batchUpdate.publish({ isEphemeral: true });
          }}
          onChange={(value) => {
            batchUpdate.setProperty("columnGap")(value);
            if (isLinked) {
              batchUpdate.setProperty("rowGap")(value);
            }
            batchUpdate.publish();
          }}
        />
      </Box>

      <Flex css={{ gridArea: "linked", px: theme.spacing[3] }} justify="center">
        <GapLinked
          isLinked={isLinked}
          onChange={(isLinked) => {
            setIsLinked(isLinked);
            if (isLinked && style.columnGap?.value) {
              batchUpdate.setProperty("rowGap")(style.columnGap.value);
              batchUpdate.publish();
            }
          }}
        />
      </Flex>

      <Box css={{ gridArea: "rowGap" }}>
        <GapInput
          icon={<GapVerticalIcon />}
          style={style}
          property="rowGap"
          intermediateValue={intermediateRowGap}
          onIntermediateChange={(value) => {
            setIntermediateRowGap(value);
            if (isLinked) {
              setIntermediateColumnGap(value);
            }
          }}
          onPreviewChange={(value) => {
            if (value === undefined) {
              batchUpdate.deleteProperty("rowGap");
              if (isLinked) {
                batchUpdate.deleteProperty("columnGap");
              }
            } else {
              batchUpdate.setProperty("rowGap")(value);
              if (isLinked) {
                batchUpdate.setProperty("columnGap")(value);
              }
            }
            batchUpdate.publish({ isEphemeral: true });
          }}
          onChange={(value) => {
            batchUpdate.setProperty("rowGap")(value);
            if (isLinked) {
              batchUpdate.setProperty("columnGap")(value);
            }
            batchUpdate.publish();
          }}
        />
      </Box>
    </Grid>
  );
};

const mapNormalTo = (
  toValue: string,
  current?: StyleValueInfo
): StyleValueInfo | undefined => {
  if (
    current === undefined ||
    current.value.type !== "keyword" ||
    current.value.value !== "normal"
  ) {
    return current;
  }

  return { ...current, value: { type: "keyword", value: toValue } };
};

const LayoutSectionFlex = ({
  currentStyle,
  setProperty,
  createBatchUpdate,
}: {
  currentStyle: RenderCategoryProps["currentStyle"];
  setProperty: RenderCategoryProps["setProperty"];
  createBatchUpdate: RenderCategoryProps["createBatchUpdate"];
}) => {
  const batchUpdate = createBatchUpdate();

  const flexWrapValue = currentStyle.flexWrap?.value;

  // From design: Notice that the align-content icon button is not visible by default.
  // This property only applies when flex-wrap is set to "wrap".
  const showAlignContent =
    flexWrapValue?.type === "keyword" &&
    (flexWrapValue.value === "wrap" || flexWrapValue.value === "wrap-reverse");

  // @todo: this and the corresponfig repeatings JSX below
  // can be extracted into a component
  const flexDirectionToggleValue =
    currentStyle.flexDirection?.value?.type === "keyword" &&
    currentStyle.flexDirection?.value?.value === "column";
  const setFlexDirectionToggleValue = (value: boolean) => {
    setProperty("flexDirection")({
      type: "keyword",
      value: value ? "column" : "row",
    });
  };

  const flexWrapToggleValue =
    currentStyle.flexWrap?.value?.type === "keyword" &&
    currentStyle.flexWrap?.value?.value === "wrap";
  const setFlexWrapToggleValue = (value: boolean) => {
    setProperty("flexWrap")({
      type: "keyword",
      value: value ? "wrap" : "nowrap",
    });
  };

  return (
    <Flex css={{ flexDirection: "column", gap: theme.spacing[5] }}>
      <Grid
        css={{
          gap: theme.spacing[5],
          gridTemplateColumns: `repeat(2, ${theme.spacing[13]}) repeat(3, ${theme.spacing[13]})`,
          gridTemplateRows: `repeat(2, ${theme.spacing[13]})`,
          gridTemplateAreas: `
            "grid grid flexDirection flexWrap ."
            "grid grid alignItems justifyContent alignContent"
          `,
          alignItems: "center",
        }}
      >
        <Box css={{ gridArea: "grid" }}>
          <FlexGrid currentStyle={currentStyle} batchUpdate={batchUpdate} />
        </Box>
        <Box css={{ gridArea: "flexDirection" }}>
          <Tooltip
            content="Flex direction"
            delayDuration={400}
            disableHoverableContent={true}
          >
            <ToggleButton
              pressed={flexDirectionToggleValue}
              onPressedChange={setFlexDirectionToggleValue}
            >
              {flexDirectionToggleValue ? (
                <ArrowDownIcon />
              ) : (
                <ArrowRightIcon />
              )}
            </ToggleButton>
          </Tooltip>
        </Box>
        <Box css={{ gridArea: "flexWrap" }}>
          <Tooltip
            content="Flex wrap"
            delayDuration={400}
            disableHoverableContent={true}
          >
            <ToggleButton
              pressed={flexWrapToggleValue}
              onPressedChange={setFlexWrapToggleValue}
            >
              {flexWrapToggleValue ? <WrapIcon /> : <NoWrapIcon />}
            </ToggleButton>
          </Tooltip>
        </Box>
        <Box css={{ gridArea: "alignItems" }}>
          <MenuControl
            property="alignItems"
            styleValue={mapNormalTo("stretch", currentStyle.alignItems)}
            setProperty={setProperty}
          />
        </Box>
        <Box css={{ gridArea: "justifyContent" }}>
          <MenuControl
            property="justifyContent"
            styleValue={mapNormalTo("start", currentStyle.justifyContent)}
            setProperty={setProperty}
          />
        </Box>
        {showAlignContent && (
          <Box css={{ gridArea: "alignContent" }}>
            <MenuControl
              property="alignContent"
              styleValue={mapNormalTo("stretch", currentStyle.alignContent)}
              setProperty={setProperty}
            />
          </Box>
        )}
      </Grid>

      <FlexGap style={currentStyle} createBatchUpdate={createBatchUpdate} />
    </Flex>
  );
};

const orderedDisplayValues = [
  "block",
  "flex",
  "inline-block",
  "inline",
  "none",
];
if (isFeatureEnabled("displayContents")) {
  orderedDisplayValues.push("contents");
}

const compareDisplayValues = (a: { name: string }, b: { name: string }) => {
  const aIndex = orderedDisplayValues.indexOf(a.name);
  const bIndex = orderedDisplayValues.indexOf(b.name);
  return aIndex - bIndex;
};

const properties: StyleProperty[] = [
  "display",
  "flexDirection",
  "flexWrap",
  "alignItems",
  "justifyContent",
  "alignContent",
  "rowGap",
  "columnGap",
];

export const LayoutSection = ({
  currentStyle,
  setProperty,
  deleteProperty,
  createBatchUpdate,
}: RenderCategoryProps) => {
  const displayValue = toValue(currentStyle.display?.value);

  const { label, items } = styleConfigByName("display");

  return (
    <CollapsibleSection
      label="Layout"
      currentStyle={currentStyle}
      properties={properties}
    >
      <>
        <Grid css={{ gridTemplateColumns: "4fr 6fr" }}>
          <PropertyName
            style={currentStyle}
            property="display"
            label={label}
            onReset={() => deleteProperty("display")}
          />
          <SelectControl
            property="display"
            currentStyle={currentStyle}
            setProperty={setProperty}
            deleteProperty={deleteProperty}
            // show only important values first and hide others with scroll
            items={items
              .filter((item) => orderedDisplayValues.includes(item.name))
              .sort(compareDisplayValues)}
          />
        </Grid>

        {(displayValue === "flex" || displayValue === "inline-flex") && (
          <LayoutSectionFlex
            currentStyle={currentStyle}
            setProperty={setProperty}
            createBatchUpdate={createBatchUpdate}
          />
        )}
      </>
    </CollapsibleSection>
  );
};
