import {
  forwardRef,
  useState,
  useEffect,
  type ElementRef,
  type ComponentProps,
  useContext,
  type ContextType,
} from "react";
import { ReactSdkContext } from "@webstudio-is/react-sdk/runtime";
import { VimeoContext } from "./vimeo";

/**
 * Options for configuring the YouTube player parameters.
 */
type YouTubePlayerParameters = {
  /**
   * Whether the video should autoplay.
   * @default false
   */
  autoplay?: boolean;

  /**
   * Whether to show player controls.
   * @default true
   */
  showControls?: boolean;

  /**
   * Whether to show related videos at the end.
   * Original parameter: `rel`
   * @default true
   */
  showRelatedVideos?: boolean;

  /**
   * Whether to enable keyboard controls.
   * @default true
   */
  keyboard?: boolean;

  /**
   * Whether the video should loop continuously.
   * @default false
   */
  loop?: boolean;

  /**
   * Whether to play inline on mobile (not fullscreen).
   * @default false
   */
  playsinline?: boolean;

  /**
   * Whether to allow fullscreen mode.
   * Original parameter: `fs`
   * @default true
   */
  allowFullscreen?: boolean;

  /**
   * Whether captions should be shown by default.
   * Original parameter: `cc_load_policy`
   * @default false
   */
  showCaptions?: boolean;

  /**
   * Whether to show annotations on the video.
   * Original parameter: `iv_load_policy`
   * @default true
   */
  showAnnotations?: boolean;

  /**
   * Start time of the video in seconds.
   * Original parameter: `start`
   */
  startTime?: number;

  /**
   * End time of the video in seconds.
   * Original parameter: `end`
   */
  endTime?: number;

  /**
   * Whether to disable keyboard controls.
   * Original parameter: `disablekb`
   * @default false
   */
  disableKeyboard?: boolean;

  /**
   * Referrer URL for tracking purposes.
   * Original parameter: `widget_referrer`
   */
  referrer?: string;

  /**
   * Type of playlist to load (`playlist`, `search`, or `user_uploads`).
   */
  listType?: string;

  /**
   * ID of the playlist to load.
   */
  listId?: string;

  /**
   * Your domain for API compliance (e.g., `https://yourdomain.com`).
   */
  origin?: string;

  /**
   * Specifies the default language that the player will use to display captions.
   * The value is an ISO 639-1 two-letter language code.
   * Original parameter: `cc_lang_pref`
   */
  captionLanguage?: string;

  /**
   * Sets the player's interface language. The value is an ISO 639-1 two-letter language code or a fully specified locale.
   * Original parameter: `hl`
   */
  language?: string;

  /**
   * Specifies the color that will be used in the player's video progress bar to highlight the amount of the video that the viewer has already seen.
   * Valid values are 'red' and 'white'.
   */
  color?: "red" | "white";
};

type YouTubePlayerOptions = {
  /** The YouTube video URL or ID */
  url?: string;
  showPreview?: boolean;
} & YouTubePlayerParameters & {
    /** Loading strategy for iframe */
    loading?: "eager" | "lazy";
  };

const PLAYER_CDN = "https://www.youtube.com";
const IMAGE_CDN = "https://img.youtube.com";

const getVideoId = (url?: string) => {
  if (!url) {
    return;
  }
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    }
    return urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop();
  } catch {
    // If not URL, assume it's a video ID
    return url;
  }
};

const getVideoUrl = (options: YouTubePlayerOptions) => {
  const videoId = getVideoId(options.url);
  if (!videoId) {
    return;
  }

  const url = new URL(`${PLAYER_CDN}/embed/${videoId}`);

  const optionsKeys = Object.keys(options) as (keyof YouTubePlayerParameters)[];

  const parameters: Record<string, string | undefined> = {};

  for (const optionsKey of optionsKeys) {
    switch (optionsKey) {
      case "autoplay":
        parameters.autoplay = options.autoplay ? "1" : "0";
        break;

      case "showControls":
        parameters.controls = options.showControls ? "1" : "0";
        break;

      case "showRelatedVideos":
        parameters.rel = options.showRelatedVideos ? "1" : "0";
        break;

      case "keyboard":
        parameters.keyboard = options.keyboard ? "1" : "0";
        break;

      case "loop":
        parameters.loop = options.loop ? "1" : "0";
        break;

      case "playsinline":
        parameters.playsinline = options.playsinline ? "1" : "0";
        break;

      case "allowFullscreen":
        parameters.fs = options.allowFullscreen ? "1" : "0";
        break;

      case "captionLanguage":
        parameters.cc_lang_pref = options.captionLanguage;
        break;

      case "showCaptions":
        parameters.cc_load_policy = options.showCaptions ? "1" : "0";
        break;

      case "showAnnotations":
        parameters.iv_load_policy = options.showAnnotations ? "1" : "3";
        break;

      case "startTime":
        parameters.start = options.startTime?.toString();
        break;

      case "endTime":
        parameters.end = options.endTime?.toString();
        break;

      case "disableKeyboard":
        parameters.disablekb = options.disableKeyboard ? "1" : "0";
        break;

      case "language":
        parameters.hl = options.language;
        break;

      case "listId":
        parameters.list = options.listId;
        break;

      case "listType":
        parameters.listType = options.listType;
        break;

      case "color":
        parameters.color = options.color;
        break;

      case "origin":
        parameters.origin = options.origin;
        break;
      case "referrer":
        parameters.widget_referrer = options.referrer;
        break;

      default:
        optionsKey satisfies never;
    }
  }

  Object.entries(parameters).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    url.searchParams.append(key, value.toString());
  });

  return url.toString();
};

const preconnect = (url: string) => {
  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = url;
  link.crossOrigin = "true";
  document.head.appendChild(link);
};

let warmed = false;

const warmConnections = () => {
  if (warmed || window.matchMedia("(hover: none)").matches) {
    return;
  }
  preconnect(PLAYER_CDN);
  preconnect(IMAGE_CDN);
  warmed = true;
};

const getPreviewImageUrl = (videoId: string) => {
  return new URL(`${IMAGE_CDN}/vi/${videoId}/maxresdefault.jpg`);
};

type PlayerStatus = "initial" | "loading" | "ready";

const EmptyState = () => {
  return (
    <div className="flex w-full h-full items-center justify-center text-lg">
      Open the "Settings" panel and paste a video URL, e.g.
      https://youtube.com/watch?v=dQw4w9WgXcQ
    </div>
  );
};

type PlayerProps = Pick<
  YouTubePlayerOptions,
  "loading" | "autoplay" | "showPreview"
> & {
  videoUrl: string;
  status: PlayerStatus;
  renderer: ContextType<typeof ReactSdkContext>["renderer"];
  previewImageUrl?: URL;
  onStatusChange: (status: PlayerStatus) => void;
  onPreviewImageUrlChange: (url?: URL) => void;
};

const Player = ({
  status,
  loading,
  videoUrl,
  previewImageUrl,
  autoplay,
  renderer,
  showPreview,
  onStatusChange,
  onPreviewImageUrlChange,
}: PlayerProps) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (autoplay && renderer !== "canvas" && status === "initial") {
      onStatusChange("loading");
    }
  }, [autoplay, status, renderer, onStatusChange]);

  useEffect(() => {
    if (renderer !== "canvas") {
      warmConnections();
    }
  }, [renderer]);

  useEffect(() => {
    const videoId = getVideoId(videoUrl);
    if (!videoId || !showPreview) {
      onPreviewImageUrlChange(undefined);
      return;
    }

    if (!previewImageUrl) {
      onPreviewImageUrlChange(getPreviewImageUrl(videoId));
    }
  }, [onPreviewImageUrlChange, showPreview, videoUrl, previewImageUrl]);

  if (renderer === "canvas" || status === "initial") {
    return null;
  }

  return (
    <iframe
      src={videoUrl}
      loading={loading}
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity,
        transition: "opacity 1s",
        border: "none",
      }}
      onLoad={() => {
        onStatusChange("ready");
        setOpacity(1);
      }}
    />
  );
};

const defaultTag = "div";

type Props = Omit<
  ComponentProps<typeof defaultTag>,
  keyof YouTubePlayerOptions
> &
  YouTubePlayerOptions;
type Ref = ElementRef<typeof defaultTag>;

export const YouTube = forwardRef<Ref, Props>(
  (
    { url, loading = "lazy", autoplay, showPreview, children, ...rest },
    ref
  ) => {
    const [status, setStatus] = useState<PlayerStatus>("initial");
    const [previewImageUrl, setPreviewImageUrl] = useState<URL>();
    const { renderer } = useContext(ReactSdkContext);

    const videoUrl = getVideoUrl({
      ...rest,
      url,
      autoplay: true,
    });

    return (
      <VimeoContext.Provider
        value={{
          status,
          previewImageUrl,
          onInitPlayer() {
            if (renderer !== "canvas") {
              setStatus("loading");
            }
          },
        }}
      >
        <div {...rest} ref={ref}>
          {!videoUrl ? (
            <EmptyState />
          ) : (
            <>
              {children}
              <Player
                autoplay={autoplay}
                videoUrl={videoUrl}
                previewImageUrl={previewImageUrl}
                loading={loading}
                showPreview={showPreview}
                renderer={renderer}
                status={status}
                onStatusChange={setStatus}
                onPreviewImageUrlChange={setPreviewImageUrl}
              />
            </>
          )}
        </div>
      </VimeoContext.Provider>
    );
  }
);

YouTube.displayName = "YouTube";
