import type { ReactNode } from "react";

export type ActionIconName =
  | "archive"
  | "arrow-left"
  | "arrow-right"
  | "calendar"
  | "check"
  | "chevron-down"
  | "download"
  | "edit"
  | "expand"
  | "grip"
  | "moon"
  | "play"
  | "plus"
  | "printer"
  | "refresh"
  | "stop"
  | "trash"
  | "upload"
  | "x";

export function ActionIcon({ name, size = 18 }: { name: ActionIconName; size?: number }) {
  let content: ReactNode;

  switch (name) {
    case "archive":
      content = <path d="M4 7.5h16M6 7.5l1 12h10l1-12M8 4h8l1 3.5H7L8 4ZM10 11h4" />;
      break;
    case "arrow-left":
      content = <path d="m14.5 5-7 7 7 7M8 12h12" />;
      break;
    case "arrow-right":
      content = <path d="m9.5 5 7 7-7 7M16 12H4" />;
      break;
    case "calendar":
      content = <path d="M5 5h14v15H5zM8 3v4M16 3v4M5 9h14" />;
      break;
    case "check":
      content = <path d="m5 12 4 4L19 6" />;
      break;
    case "chevron-down":
      content = <path d="m6 9 6 6 6-6" />;
      break;
    case "download":
      content = <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />;
      break;
    case "edit":
      content = <path d="m4 16.5-.5 4 4-.5L19 8.5 15.5 5 4 16.5ZM13.8 6.7l3.5 3.5" />;
      break;
    case "expand":
      content = <path d="M8 4H4v4M4 4l6 6M16 20h4v-4M20 20l-6-6" />;
      break;
    case "grip":
      content = (
        <path d="M8 5h.01M8 12h.01M8 19h.01M16 5h.01M16 12h.01M16 19h.01" strokeWidth="3" />
      );
      break;
    case "moon":
      content = <path d="M19 15.5A7.5 7.5 0 0 1 8.5 5 7.5 7.5 0 1 0 19 15.5Z" />;
      break;
    case "play":
      content = <path d="m8 5 11 7-11 7V5Z" />;
      break;
    case "plus":
      content = <path d="M12 5v14M5 12h14" />;
      break;
    case "printer":
      content = (
        <path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M7 14h10v6H7z" />
      );
      break;
    case "refresh":
      content = <path d="M19 8a7 7 0 1 0 1 7M19 4v4h-4" />;
      break;
    case "stop":
      content = <path d="M7 5h10v14H7z" />;
      break;
    case "trash":
      content = <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />;
      break;
    case "upload":
      content = <path d="M12 20V9m0 0L8 13m4-4 4 4M5 4h14" />;
      break;
    case "x":
      content = <path d="m6 6 12 12M18 6 6 18" />;
      break;
  }

  return (
    <svg
      aria-hidden="true"
      className="action-icon"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {content}
    </svg>
  );
}
