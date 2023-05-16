import {
  forwardRef,
  useContext,
  useEffect,
  useRef,
  type ForwardedRef,
} from "react";
import { mergeRefs } from "@react-aria/utils";
import { ReactSdkContext } from "../context";

type Props = {
  code: string;
  executeScriptInCanvas: boolean;
};

type ChildProps = {
  innerRef: ForwardedRef<HTMLDivElement>;
  // code can be actually undefined when prop is not provided
  code?: string;
};

/**
 * Scripts are executed when rendered client side
 */
const ExecutableHtml = (props: ChildProps) => {
  const { code, innerRef, ...rest } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null || code === undefined) {
      return;
    }
    // the trick to execute inserted scripts
    const range = document.createRange();
    range.setStart(container, 0);
    const fragment = range.createContextualFragment(code);
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.append(fragment);
  }, [code]);

  return (
    <div
      {...rest}
      ref={mergeRefs(innerRef, containerRef)}
      style={{ display: "contents" }}
    />
  );
};

/**
 * Scripts are executed when rendered server side
 */
const InnerHtml = (props: ChildProps) => {
  const { code, innerRef, ...rest } = props;

  return (
    <div
      {...rest}
      ref={innerRef}
      style={{ display: "contents" }}
      dangerouslySetInnerHTML={{ __html: props.code ?? "" }}
    />
  );
};

const Placeholder = (props: ChildProps) => {
  const { code, innerRef, ...rest } = props;
  return (
    <div ref={innerRef} {...rest} style={{ padding: "20px" }}>
      Paste html into "Code" prop
    </div>
  );
};

export const Html = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { renderer } = useContext(ReactSdkContext);
  const { code, executeScriptInCanvas, ...rest } = props;

  // code can be actually undefined when prop is not provided
  if (code === undefined || code.trim().length === 0) {
    return <Placeholder innerRef={ref} {...rest} />;
  }

  if (renderer === "canvas" && executeScriptInCanvas === true) {
    return <ExecutableHtml innerRef={ref} code={code} {...rest} />;
  }

  return <InnerHtml innerRef={ref} code={code} {...rest} />;
});

Html.displayName = "Html";
