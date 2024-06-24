import {
  List,
  parse,
  lexer,
  generate,
  type CssNode,
  type Value,
} from "css-tree";

const createValueNode = (data?: CssNode[]): Value => ({
  type: "Value",
  children: new List<CssNode>().fromArray(data ?? []),
});

const createNumber = (value: string): Value => ({
  type: "Value",
  children: new List<CssNode>().appendData({
    type: "Number",
    value,
  }),
});

const createDimension = (value: string, unit: string): Value => ({
  type: "Value",
  children: new List<CssNode>().appendData({
    type: "Dimension",
    value,
    unit,
  }),
});

const createIdentifier = (name: string): Value => ({
  type: "Value",
  children: new List<CssNode>().appendData({
    type: "Identifier",
    name,
  }),
});

const createInitialNode = () => createIdentifier("initial");

const getValueList = (value: CssNode): CssNode[] => {
  const children = "children" in value ? value.children?.toArray() : undefined;
  return children ?? [value];
};

const splitByOperator = (node: CssNode, operator: string) => {
  const list = getValueList(node);
  const lists: Array<CssNode[]> = [[]];
  for (const node of list) {
    if (node.type === "Operator" && node.value === operator) {
      lists.push([]);
    } else {
      lists.at(-1)?.push(node);
    }
  }
  return lists.map((list) => {
    if (list.length === 0) {
      return;
    }
    return createValueNode(list);
  });
};

const joinByOperator = (list: List<CssNode> | CssNode[], operator: string) => {
  const joined: CssNode[] = [];
  for (const node of list) {
    if (joined.length > 0) {
      joined.push({ type: "Operator", value: operator });
    }
    joined.push(node);
  }
  return joined;
};

/**
 * Match the list of specified syntaxes with nodes
 * Matches can be placed in different order than the list
 * All specified matches are optional
 * Value Definition Syntax use <Type> || <Type> operator for describe this
 */
const parseUnordered = (syntaxes: string[], value: CssNode) => {
  const matched = new Map<number, Value>();
  const nodes = getValueList(value);
  let cursor = 0;
  while (matched.size < syntaxes.length && cursor < nodes.length) {
    let newCursor = cursor;
    for (let syntaxIndex = 0; syntaxIndex < syntaxes.length; syntaxIndex += 1) {
      if (matched.has(syntaxIndex)) {
        continue;
      }
      const syntax = syntaxes[syntaxIndex];
      const buffer = [];
      let value: undefined | Value;
      for (let nodeIndex = cursor; nodeIndex < nodes.length; nodeIndex += 1) {
        const node = nodes[nodeIndex];
        buffer.push(node);
        const newValue = createValueNode(buffer);
        if (lexer.match(syntax, newValue).matched) {
          value = newValue;
          newCursor = nodeIndex + 1;
        }
      }
      if (value) {
        matched.set(syntaxIndex, value);
        break;
      }
    }
    // last pass is the same as previous one
    // which means infinite loop detected
    if (cursor === newCursor) {
      break;
    }
    cursor = newCursor;
  }
  return [
    ...syntaxes.map((_syntax, index) => matched.get(index)),
    createValueNode(nodes.slice(cursor)),
  ];
};

/**
 *
 * border = <line-width> || <line-style> || <color>
 *
 * should also reset border-image but would bloat
 * resulting data for very rare usecase
 *
 */
const expandBorder = function* (property: string, value: CssNode) {
  switch (property) {
    case "border":
    case "border-inline":
    case "border-inline-start":
    case "border-inline-end":
    case "border-block":
    case "border-block-start":
    case "border-block-end":
    case "border-top":
    case "border-right":
    case "border-bottom":
    case "border-left":
    case "outline": {
      const [width, style, color] = parseUnordered(
        ["<line-width>", "<line-style>", "<color>"],
        value
      );
      yield [`${property}-width`, width ?? createInitialNode()] as const;
      yield [`${property}-style`, style ?? createInitialNode()] as const;
      yield [`${property}-color`, color ?? createInitialNode()] as const;
      break;
    }
    default:
      yield [property, value] as const;
  }
};

type GetProperty = (edge: string) => string;

const expandBox = function* (getProperty: GetProperty, value: CssNode) {
  const [top, right, bottom, left] = getValueList(value);
  yield [getProperty("top"), top] as const;
  yield [getProperty("right"), right ?? top] as const;
  yield [getProperty("bottom"), bottom ?? top] as const;
  yield [getProperty("left"), left ?? right ?? top] as const;
};

const expandLogical = function* (getProperty: GetProperty, value: CssNode) {
  const [start, end] = getValueList(value);
  yield [getProperty("start"), start] as const;
  yield [getProperty("end"), end ?? start] as const;
};

const expandEdges = function* (property: string, value: CssNode) {
  switch (property) {
    case "border-width":
    case "border-style":
    case "border-color": {
      const type = property.split("-").pop() ?? ""; // width, style or color
      yield* expandBox((edge) => `border-${edge}-${type}`, value);
      break;
    }
    case "border-inline-width":
    case "border-inline-style":
    case "border-inline-color": {
      const type = property.split("-").pop() ?? ""; // width, style or color
      yield* expandLogical((edge) => `border-inline-${edge}-${type}`, value);
      break;
    }
    case "border-block-width":
    case "border-block-style":
    case "border-block-color": {
      const type = property.split("-").pop() ?? ""; // width, style or color
      yield* expandLogical((edge) => `border-block-${edge}-${type}`, value);
      break;
    }
    default:
      yield [property, value] as const;
  }
};

/**
 *
 * border-radius = <length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?
 *
 */
const expandBorderRadius = function* (value: CssNode) {
  const firstRadius = [];
  const secondRadius = [];
  let hasSecondRadius = false;
  for (const node of getValueList(value)) {
    if (node.type === "Operator" && node.value === "/") {
      hasSecondRadius = true;
    } else if (hasSecondRadius) {
      secondRadius.push(node);
    } else {
      firstRadius.push(node);
    }
  }
  const topLeft = createValueNode();
  const topRight = createValueNode();
  const bottomRight = createValueNode();
  const bottomLeft = createValueNode();
  // add first radius
  const [firstTopLeft, firstTopRight, firstBottomRight, firstBottomLeft] =
    firstRadius;
  topLeft.children.appendData(firstTopLeft);
  topRight.children.appendData(firstTopRight ?? firstTopLeft);
  bottomRight.children.appendData(firstBottomRight ?? firstTopLeft);
  bottomLeft.children.appendData(
    firstBottomLeft ?? firstTopRight ?? firstTopLeft
  );
  // add second radius if specified
  const [secondTopLeft, secondTopRight, secondBottomRight, secondBottomLeft] =
    secondRadius;
  if (hasSecondRadius) {
    topLeft.children.appendData(secondTopLeft);
    topRight.children.appendData(secondTopRight ?? secondTopLeft);
    bottomRight.children.appendData(secondBottomRight ?? secondTopLeft);
    bottomLeft.children.appendData(
      secondBottomLeft ?? secondTopRight ?? secondTopLeft
    );
  }
  yield ["border-top-left-radius", topLeft] as const;
  yield ["border-top-right-radius", topRight] as const;
  yield ["border-bottom-right-radius", bottomRight] as const;
  yield ["border-top-left-radius", bottomLeft] as const;
};

/**
 *
 * border-image =
 *   <'border-image-source'>
 *   || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]?
 *   || <'border-image-repeat'>
 * <border-image-source> = none | <image>
 * <border-image-slice> = [ <number [0,∞]> | <percentage [0,∞]> ]{1,4} && fill?
 * <border-image-width> = [ <length-percentage [0,∞]> | <number [0,∞]> | auto ]{1,4}
 * <border-image-outset> = [ <length [0,∞]> | <number [0,∞]> ]{1,4}
 * <border-image-repeat> = [ stretch | repeat | round | space ]{1,2}
 *
 */
const expandBorderImage = function* (value: CssNode) {
  const [source, config, repeat] = parseUnordered(
    [
      "<'border-image-source'>",
      "<'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]?",
      "<'border-image-repeat'>",
    ],
    value
  );
  let slice: undefined | CssNode;
  let width: undefined | CssNode;
  let outset: undefined | CssNode;
  if (config) {
    [slice, width, outset] = splitByOperator(config, "/");
  }
  yield ["border-image-source", source ?? createInitialNode()] as const;
  yield ["border-image-slice", slice ?? createInitialNode()] as const;
  yield ["border-image-width", width ?? createInitialNode()] as const;
  yield ["border-image-outset", outset ?? createInitialNode()] as const;
  yield ["border-image-repeat", repeat ?? createInitialNode()] as const;
};

/**
 *
 * font =
 *   [ <'font-style'> || <font-variant-css21> || <'font-weight'> || <'font-stretch'> ]?
 *   <'font-size'> [ / <'line-height'> ]? <'font-family'>
 *
 */
const expandFont = function* (value: CssNode) {
  const [fontStyle, fontVariant, fontWeight, fontWidth, config] =
    parseUnordered(
      [
        "<'font-style'>",
        "<font-variant-css21>",
        "<'font-weight'>",
        "<'font-stretch'>",
      ],
      value
    );
  let fontSize: CssNode = createInitialNode();
  let lineHeight: CssNode = createInitialNode();
  let fontFamily: CssNode = createInitialNode();
  if (config) {
    if (
      lexer.match("<'font-size'> / <'line-height'> <'font-family'>", config)
        .matched
    ) {
      const [fontSizeNode, _slashNode, lineHeightNode, ...fontFamilyNodes] =
        getValueList(config);
      fontSize = fontSizeNode;
      lineHeight = lineHeightNode;
      fontFamily = createValueNode(fontFamilyNodes);
    } else {
      const [fontSizeNode, ...fontFamilyNodes] = getValueList(config);
      fontSize = fontSizeNode;
      fontFamily = createValueNode(fontFamilyNodes);
    }
  }
  yield ["font-style", fontStyle ?? createInitialNode()] as const;
  yield ["font-variant-caps", fontVariant ?? createInitialNode()] as const;
  yield ["font-weight", fontWeight ?? createInitialNode()] as const;
  yield ["font-stretch", fontWidth ?? createInitialNode()] as const;
  yield ["font-size", fontSize] as const;
  yield ["line-height", lineHeight] as const;
  yield ["font-family", fontFamily] as const;
};

/**
 *
 * font-synthesis = none | [ weight || style || small-caps || position ]
 *
 */
const expandFontSynthesis = function* (value: CssNode) {
  const [weight, style, smallCaps, position] = parseUnordered(
    ["weight", "style", "small-caps", "position"],
    value
  );
  const auto = createIdentifier("auto");
  const none = createIdentifier("none");
  yield ["font-synthesis-weight", weight ? auto : none] as const;
  yield ["font-synthesis-style", style ? auto : none] as const;
  yield ["font-synthesis-small-caps", smallCaps ? auto : none] as const;
  yield ["font-synthesis-position", position ? auto : none] as const;
};

/**
 *
 * font-variant =
 *   normal |
 *   none |
 *   [
 *     [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ] ||
 *     [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] ||
 *     [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ] ||
 *     [ <east-asian-variant-values> || <east-asian-width-values> || ruby ] ||
 *     [ sub | super ] ||
 *     [ text | emoji | unicode ]
 *   ]
 *
 */
const expandFontVariant = function* (value: CssNode) {
  const [ligatures, caps, alternates, numeric, eastAsian, position, emoji] =
    parseUnordered(
      [
        "[ normal | none | <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]",
        "[ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ]",
        "[ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]",
        "[ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]",
        "[ <east-asian-variant-values> || <east-asian-width-values> || ruby ]",
        "[ sub | super ]",
        "[ text | emoji | unicode ]",
      ],
      value
    );
  const normal = createIdentifier("normal");
  yield ["font-variant-ligatures", ligatures ?? normal] as const;
  yield ["font-variant-caps", caps ?? normal] as const;
  yield ["font-variant-alternates", alternates ?? normal] as const;
  yield ["font-variant-numeric", numeric ?? normal] as const;
  yield ["font-variant-east-asian", eastAsian ?? normal] as const;
  yield ["font-variant-position", position ?? normal] as const;
  yield ["font-variant-emoji", emoji ?? normal] as const;
};

const expandFlex = function* (value: CssNode) {
  const zero = createNumber("0");
  const one = createNumber("1");
  const auto = createIdentifier("auto");
  let grow: undefined | Value;
  let shrink: undefined | Value;
  let basis: undefined | Value;
  if (lexer.match("initial", value).matched) {
    [grow, shrink, basis] = [zero, one, auto];
  } else if (lexer.match("auto", value).matched) {
    [grow, shrink, basis] = [one, one, auto];
  } else if (lexer.match("none", value).matched) {
    [grow, shrink, basis] = [zero, zero, auto];
  } else {
    [grow, shrink, basis] = parseUnordered(
      ["<'flex-grow'>", "<'flex-shrink'>", "<'flex-basis'>"],
      value
    );
  }
  yield ["flex-grow", grow ?? one] as const;
  yield ["flex-shrink", shrink ?? one] as const;
  yield ["flex-basis", basis ?? zero] as const;
};

/**
 *
 * animation = <single-animation>#
 *
 * <single-animation> =
 *   <time [0s,∞]> ||
 *   <easing-function> ||
 *   <time> ||
 *   <single-animation-iteration-count> ||
 *   <single-animation-direction> ||
 *   <single-animation-fill-mode> ||
 *   <single-animation-play-state> ||
 *   [ none | <keyframes-name> ]
 *
 */
const expandAnimation = function* (value: CssNode) {
  const durations: CssNode[] = [];
  const timings: CssNode[] = [];
  const delays: CssNode[] = [];
  const iterationCounts: CssNode[] = [];
  const directions: CssNode[] = [];
  const fillModes: CssNode[] = [];
  const playStates: CssNode[] = [];
  const names: CssNode[] = [];
  for (const animation of splitByOperator(value, ",")) {
    if (animation === undefined) {
      continue;
    }
    const [
      duration,
      timing,
      delay,
      iterationCount,
      direction,
      fillMode,
      playState,
      name,
    ] = parseUnordered(
      [
        "<time [0s,∞]>",
        "<easing-function>",
        "<time>",
        "<single-animation-iteration-count>",
        "<single-animation-direction>",
        "<single-animation-fill-mode>",
        "<single-animation-play-state>",
        "[ none | <keyframes-name> ]",
      ],
      animation
    );
    durations.push(duration ?? createDimension("0", "s"));
    timings.push(timing ?? createIdentifier("ease"));
    delays.push(delay ?? createDimension("0", "s"));
    iterationCounts.push(iterationCount ?? createNumber("1"));
    directions.push(direction ?? createIdentifier("normal"));
    fillModes.push(fillMode ?? createIdentifier("none"));
    playStates.push(playState ?? createIdentifier("running"));
    names.push(name ?? createIdentifier("none"));
  }
  yield [
    "animation-duration",
    createValueNode(joinByOperator(durations, ",")),
  ] as const;
  yield [
    "animation-timing-function",
    createValueNode(joinByOperator(timings, ",")),
  ] as const;
  yield [
    "animation-delay",
    createValueNode(joinByOperator(delays, ",")),
  ] as const;
  yield [
    "animation-iteration-count",
    createValueNode(joinByOperator(iterationCounts, ",")),
  ] as const;
  yield [
    "animation-direction",
    createValueNode(joinByOperator(directions, ",")),
  ] as const;
  yield [
    "animation-fill-mode",
    createValueNode(joinByOperator(fillModes, ",")),
  ] as const;
  yield [
    "animation-play-state",
    createValueNode(joinByOperator(playStates, ",")),
  ] as const;
  yield [
    "animation-name",
    createValueNode(joinByOperator(names, ",")),
  ] as const;
  // reset with animation shorthand but cannot be set with it
  yield ["animation-timeline", createIdentifier("auto")] as const;
  yield ["animation-range-start", createIdentifier("normal")] as const;
  yield ["animation-range-end", createIdentifier("normal")] as const;
};

/**
 *
 * transition = <single-transition>#
 *
 * <single-transition> =
 *   [ none | <single-transition-property> ] ||
 *   <time> ||
 *   <easing-function> ||
 *   <time>
 *
 */
const expandTransition = function* (value: CssNode) {
  const properties: CssNode[] = [];
  const durations: CssNode[] = [];
  const easings: CssNode[] = [];
  const delays: CssNode[] = [];
  const behaviors: CssNode[] = [];
  for (const transition of splitByOperator(value, ",")) {
    if (transition === undefined) {
      continue;
    }
    const [property, duration, easing, delay, behavior] = parseUnordered(
      [
        "[ none | <single-transition-property> ]",
        "<time>",
        "<easing-function>",
        "<time>",
        // <transition-behavior-value> is not supported by csstree
        "normal | allow-discrete",
      ],
      transition
    );
    properties.push(property ?? createIdentifier("all"));
    durations.push(duration ?? createDimension("0", "s"));
    easings.push(easing ?? createIdentifier("ease"));
    delays.push(delay ?? createDimension("0", "s"));
    behaviors.push(behavior ?? createIdentifier("normal"));
  }
  yield [
    "transition-property",
    createValueNode(joinByOperator(properties, ",")),
  ] as const;
  yield [
    "transition-duration",
    createValueNode(joinByOperator(durations, ",")),
  ] as const;
  yield [
    "transition-timing-function",
    createValueNode(joinByOperator(easings, ",")),
  ] as const;
  yield [
    "transition-delay",
    createValueNode(joinByOperator(delays, ",")),
  ] as const;
  yield [
    "transition-behavior",
    createValueNode(joinByOperator(behaviors, ",")),
  ] as const;
};

/**
 *
 * mask = <mask-layer>#
 *
 * <mask-layer> =
 *   <mask-reference> ||
 *   <position> [ / <bg-size> ]? ||
 *   <repeat-style> ||
 *   <geometry-box> ||
 *   [ <geometry-box> | no-clip ] ||
 *   <compositing-operator> ||
 *   <masking-mode>
 *
 * should also reset mask-border but would bloat
 * resulting data for very rare usecase
 *
 */
const expandMask = function* (value: CssNode) {
  const references: CssNode[] = [];
  const positions: CssNode[] = [];
  const bgSizes: CssNode[] = [];
  const repeatStyles: CssNode[] = [];
  const origins: CssNode[] = [];
  const clips: CssNode[] = [];
  const compositionOperators: CssNode[] = [];
  const modes: CssNode[] = [];
  for (const mask of splitByOperator(value, ",")) {
    if (mask === undefined) {
      continue;
    }
    const [
      reference,
      positionAndSize,
      repeatStyle,
      origin,
      clip,
      compositingOperator,
      mode,
    ] = parseUnordered(
      [
        "<mask-reference>",
        "<position> [ / <bg-size> ]?",
        "<repeat-style>",
        "<geometry-box>",
        "[ <geometry-box> | no-clip ]",
        "<compositing-operator>",
        "<masking-mode>",
      ],
      mask
    );
    references.push(reference ?? createIdentifier("none"));
    let position: undefined | CssNode;
    let bgSize: undefined | CssNode;
    if (positionAndSize) {
      [position, bgSize] = splitByOperator(positionAndSize, "/");
    }
    positions.push(
      position ??
        createValueNode([
          { type: "Dimension", value: "0", unit: "%" },
          { type: "Dimension", value: "0", unit: "%" },
        ])
    );
    bgSizes.push(bgSize ?? createIdentifier("auto"));
    repeatStyles.push(repeatStyle ?? createIdentifier("repeat"));
    origins.push(origin ?? createIdentifier("border-box"));
    clips.push(clip ?? origin ?? createIdentifier("border-box"));
    compositionOperators.push(compositingOperator ?? createIdentifier("add"));
    modes.push(mode ?? createIdentifier("match-source"));
  }
  yield [
    "mask-image",
    createValueNode(joinByOperator(references, ",")),
  ] as const;
  yield [
    "mask-position",
    createValueNode(joinByOperator(positions, ",")),
  ] as const;
  yield ["mask-size", createValueNode(joinByOperator(bgSizes, ","))] as const;
  yield [
    "mask-repeat",
    createValueNode(joinByOperator(repeatStyles, ",")),
  ] as const;
  yield ["mask-origin", createValueNode(joinByOperator(origins, ","))] as const;
  yield ["mask-clip", createValueNode(joinByOperator(clips, ","))] as const;
  yield [
    "mask-composite",
    createValueNode(joinByOperator(compositionOperators, ",")),
  ] as const;
  yield ["mask-mode", createValueNode(joinByOperator(modes, ","))] as const;
};

/**
 *
 * mask-border =
 *   <'mask-border-source'> ||
 *   <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? ||
 *   <'mask-border-repeat'> ||
 *   <'mask-border-mode'>
 *
 */
const expandMaskBorder = function* (value: CssNode) {
  const [source, config, repeat, mode] = parseUnordered(
    [
      "<'mask-border-source'>",
      "<'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]?",
      "<'mask-border-repeat'>",
      "<'mask-border-mode'>",
    ],
    value
  );
  let slice: undefined | CssNode;
  let width: undefined | CssNode;
  let outset: undefined | CssNode;
  if (config) {
    [slice, width, outset] = splitByOperator(config, "/");
  }
  yield ["mask-border-source", source ?? createInitialNode()] as const;
  yield ["mask-border-slice", slice ?? createInitialNode()] as const;
  yield ["mask-border-width", width ?? createInitialNode()] as const;
  yield ["mask-border-outset", outset ?? createInitialNode()] as const;
  yield ["mask-border-repeat", repeat ?? createInitialNode()] as const;
  yield ["mask-border-mode", mode ?? createInitialNode()] as const;
};

/**
 *
 * offset = [
 *   <'offset-position'>?
 *   [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]?
 * ]!
 * [ / <'offset-anchor'> ]?
 *
 */
const expandOffset = function* (value: CssNode) {
  const [config, anchor] = splitByOperator(value, "/");
  const [position, config2] = parseUnordered(
    [
      `<'offset-position'>`,
      `[ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]`,
    ],
    config ?? createIdentifier("none")
  );
  let path;
  let distance;
  let rotate;
  if (config2) {
    [path, distance, rotate] = parseUnordered(
      [`<'offset-path'>`, `<'offset-distance'>`, `<'offset-rotate'>`],
      config2
    );
  }
  yield ["offset-position", position ?? createIdentifier("normal")] as const;
  yield ["offset-path", path ?? createIdentifier("none")] as const;
  yield ["offset-distance", distance ?? createNumber("0")] as const;
  yield ["offset-rotate", rotate ?? createIdentifier("auto")] as const;
  yield ["offset-anchor", anchor ?? createIdentifier("auto")] as const;
};

/**
 *
 * scroll-timeline = [ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#
 *
 */
const expandScrollTimeline = function* (value: CssNode) {
  const list = splitByOperator(value, ",");
  const names: CssNode[] = [];
  const axises: CssNode[] = [];
  for (const singleTimeline of list) {
    const [name, axis] = getValueList(
      singleTimeline ?? createIdentifier("none")
    );
    names.push(name);
    axises.push(axis ?? createIdentifier("block"));
  }
  yield [
    "scroll-timeline-name",
    createValueNode(joinByOperator(names, ",")),
  ] as const;
  yield [
    "scroll-timeline-axis",
    createValueNode(joinByOperator(axises, ",")),
  ] as const;
};

/**
 *
 * grid-template =
 *   none |
 *   [ <'grid-template-rows'> / <'grid-template-columns'> ] |
 *   [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?
 *
 */
const expandGridTemplate = function* (value: CssNode) {
  let rows = createIdentifier("none");
  let columns = createIdentifier("none");
  let areas = createIdentifier("none");
  [rows = createIdentifier("none"), columns = createIdentifier("none")] =
    splitByOperator(value, "/");
  const rowsNodes: CssNode[] = [];
  const areasNodes: CssNode[] = [];
  for (const node of getValueList(rows)) {
    if (node.type === "String") {
      areasNodes.push(node);
    } else {
      rowsNodes.push(node);
    }
  }
  if (areasNodes.length > 0) {
    areas = createValueNode(areasNodes);
    rows = createValueNode(rowsNodes);
  }
  yield ["grid-template-areas", areas] as const;
  yield ["grid-template-rows", rows] as const;
  yield ["grid-template-columns", columns] as const;
};

/**
 *
 * grid =
 *   <'grid-template'> |
 *   <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? |
 *   [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>
 *
 */
const expandGrid = function* (value: CssNode) {
  const areas = createIdentifier("none");
  let templateRows = createIdentifier("none");
  let templateColumns = createIdentifier("none");
  let autoFlow = createIdentifier("row");
  let autoRows = createIdentifier("auto");
  let autoColumns = createIdentifier("auto");
  const [rows = createIdentifier("none"), columns = createIdentifier("none")] =
    splitByOperator(value, "/");
  if (lexer.match(`<'grid-template'>`, value).matched) {
    yield* expandGridTemplate(value);
    yield ["grid-auto-flow.", autoFlow] as const;
    yield ["grid-auto-rows", autoRows] as const;
    yield ["grid-auto-columns", autoColumns] as const;
    return;
  }
  if (
    lexer.match(`[ auto-flow && dense? ] <'grid-auto-rows'>?`, rows).matched
  ) {
    const [autoFlowKeyword, denseKeyword, config] = parseUnordered(
      ["auto-flow", "dense", `<'grid-auto-rows'>?`],
      rows
    );
    if (autoFlowKeyword) {
      autoFlow = createIdentifier("row");
      if (denseKeyword) {
        autoFlow.children.appendList(denseKeyword.children);
      }
    }
    autoRows = config ?? createIdentifier("auto");
    templateColumns = columns;
  }
  if (
    lexer.match(`[ auto-flow && dense? ] <'grid-auto-columns'>?`, columns)
      .matched
  ) {
    const [autoFlowKeyword, denseKeyword, config] = parseUnordered(
      ["auto-flow", "dense", `<'grid-auto-columns'>?`],
      columns
    );
    if (autoFlowKeyword) {
      autoFlow = createIdentifier("column");
      if (denseKeyword) {
        autoFlow.children.appendList(denseKeyword.children);
      }
    }
    autoColumns = config ?? createIdentifier("auto");
    templateRows = rows;
  }
  yield ["grid-template-areas", areas] as const;
  yield ["grid-template-rows", templateRows] as const;
  yield ["grid-template-columns", templateColumns] as const;
  yield ["grid-auto-flow.", autoFlow] as const;
  yield ["grid-auto-rows", autoRows] as const;
  yield ["grid-auto-columns", autoColumns] as const;
};

const expandShorthand = function* (property: string, value: CssNode) {
  switch (property) {
    case "font":
      yield* expandFont(value);
      break;

    case "font-synthesis":
      yield* expandFontSynthesis(value);
      break;

    case "font-variant":
      yield* expandFontVariant(value);
      break;

    case "text-decoration": {
      const [line, style, color] = parseUnordered(
        [
          "<'text-decoration-line'>",
          "<'text-decoration-style'>",
          "<'text-decoration-color'>",
        ],
        value
      );
      yield ["text-decoration-line", line ?? createInitialNode()] as const;
      yield ["text-decoration-style", style ?? createInitialNode()] as const;
      yield ["text-decoration-color", color ?? createInitialNode()] as const;
      break;
    }

    case "text-emphasis": {
      const [style, color] = parseUnordered(
        ["<'text-emphasis-style'>", "<'text-emphasis-color'>"],
        value
      );
      yield ["text-emphasis-style", style ?? createInitialNode()] as const;
      yield ["text-emphasis-color", color ?? createInitialNode()] as const;
      break;
    }

    case "border-radius":
      yield* expandBorderRadius(value);
      break;

    case "border-image":
      yield* expandBorderImage(value);
      break;

    case "mask":
      yield* expandMask(value);
      break;

    case "mask-border":
      yield* expandMaskBorder(value);
      break;

    case "margin":
    case "padding":
      yield* expandBox((edge) => `${property}-${edge}`, value);
      break;

    case "margin-inline":
    case "margin-block":
    case "padding-inline":
    case "padding-block":
      yield* expandLogical((edge) => `${property}-${edge}`, value);
      break;

    case "inset":
      yield* expandBox((edge) => edge, value);
      break;

    case "inset-inline":
    case "inset-block":
      yield* expandLogical((edge) => `${property}-${edge}`, value);
      break;

    case "gap":
    case "grid-gap": {
      const [rowGap, columnGap] = getValueList(value);
      yield ["row-gap", rowGap] as const;
      yield ["column-gap", columnGap ?? rowGap] as const;
      break;
    }

    case "grid-row-gap":
      yield ["row-gap", value] as const;
      break;

    case "grid-column-gap":
      yield ["column-gap", value] as const;
      break;

    case "grid-area": {
      const [rowStart, columnStart, rowEnd, columnEnd] = splitByOperator(
        value,
        "/"
      );
      yield ["grid-row-start", rowStart ?? createIdentifier("auto")] as const;
      yield [
        "grid-column-start",
        columnStart ?? createIdentifier("auto"),
      ] as const;
      yield ["grid-row-end", rowEnd ?? createIdentifier("auto")] as const;
      yield ["grid-column-end", columnEnd ?? createIdentifier("auto")] as const;
      break;
    }

    case "grid-row": {
      const [start, end] = splitByOperator(value, "/");
      yield ["grid-row-start", start ?? createIdentifier("auto")] as const;
      yield ["grid-row-end", end ?? createIdentifier("auto")] as const;
      break;
    }

    case "grid-column": {
      const [start, end] = splitByOperator(value, "/");
      yield ["grid-column-start", start ?? createIdentifier("auto")] as const;
      yield ["grid-column-end", end ?? createIdentifier("auto")] as const;
      break;
    }

    case "grid-template":
      yield* expandGridTemplate(value);
      break;

    case "grid":
      yield* expandGrid(value);
      break;

    case "flex":
      yield* expandFlex(value);
      break;

    case "flex-flow": {
      const [direction, wrap] = parseUnordered(
        ["<'flex-direction'>", "<'flex-wrap'>"],
        value
      );
      yield ["flex-direction", direction ?? createInitialNode()] as const;
      yield ["flex-wrap", wrap ?? createInitialNode()] as const;
      break;
    }

    case "place-content": {
      const [align, justify] = getValueList(value);
      yield ["align-content", align] as const;
      yield ["justify-content", justify ?? align] as const;
      break;
    }

    case "place-items": {
      const [align, justify] = getValueList(value);
      yield ["align-items", align] as const;
      yield ["justify-items", justify ?? align] as const;
      break;
    }

    case "place-self": {
      const [align, justify] = getValueList(value);
      yield ["align-self", align] as const;
      yield ["justify-self", justify ?? align] as const;
      break;
    }

    case "columns": {
      const [width, count] = parseUnordered(
        ["<'column-width'>", "<'column-count'>"],
        value
      );
      yield ["column-width", width ?? createInitialNode()] as const;
      yield ["column-count", count ?? createInitialNode()] as const;
      break;
    }

    case "column-rule": {
      const [width, style, color] = parseUnordered(
        [
          "<'column-rule-width'>",
          "<'column-rule-style'>",
          "<'column-rule-color'>",
        ],
        value
      );
      yield ["column-rule-width", width ?? createInitialNode()] as const;
      yield ["column-rule-style", style ?? createInitialNode()] as const;
      yield ["column-rule-color", color ?? createInitialNode()] as const;
      break;
    }

    case "list-style": {
      const [position, image, type] = parseUnordered(
        [
          "<'list-style-position'>",
          "<'list-style-image'>",
          "<'list-style-type'>",
        ],
        value
      );
      yield ["list-style-position", position ?? createInitialNode()] as const;
      yield ["list-style-image", image ?? createInitialNode()] as const;
      yield ["list-style-type", type ?? createInitialNode()] as const;
      break;
    }

    case "animation":
      yield* expandAnimation(value);
      break;

    case "transition":
      yield* expandTransition(value);
      break;

    case "offset":
      yield* expandOffset(value);
      break;

    case "scroll-timeline":
      yield* expandScrollTimeline(value);
      break;

    case "scroll-margin":
    case "scroll-padding":
      yield* expandBox((edge) => `${property}-${edge}`, value);
      break;

    case "scroll-margin-inline":
    case "scroll-margin-block":
    case "scroll-padding-inline":
    case "scroll-padding-block":
      yield* expandLogical((edge) => `${property}-${edge}`, value);
      break;

    case "overflow": {
      const [x, y] = getValueList(value);
      yield ["overflow-x", x] as const;
      yield ["overflow-y", y ?? x] as const;
      break;
    }

    default:
      yield [property, value] as const;
  }
};

const parseValue = function* (property: string, value: string) {
  try {
    const ast = parse(value, { context: "value" });
    yield [property, ast] as const;
  } catch {
    // empty block
  }
};

export const expandShorthands = (
  shorthands: [property: string, value: string][]
) => {
  const longhands: [property: string, value: string][] = [];
  for (const [property, value] of shorthands) {
    const generator = parseValue(property, value);

    for (const [property, value] of generator) {
      const generator = expandBorder(property, value);

      for (const [property, value] of generator) {
        const generator = expandEdges(property, value);

        for (const [property, value] of generator) {
          const generator = expandShorthand(property, value);

          for (const [property, value] of generator) {
            longhands.push([property, generate(value)]);
          }
        }
      }
    }
  }
  return longhands;
};
