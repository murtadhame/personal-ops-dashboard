// Clean stroke icon set (lucide-style), replacing emoji.
// 24x24, currentColor stroke. Usage: <Icon name="home" size={20} />
import type { CSSProperties } from "react";

const ICONS: Record<string, React.ReactNode> = {
  home: <><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5 11 15l4.5-5" /></>,
  layers: <><path d="M12 3 3 7.5 12 12l9-4.5z" /><path d="M3 12.5 12 17l9-4.5" /><path d="M3 16.5 12 21l9-4.5" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 6.1 19.7l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 13H4.4a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 6.3 6.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.6V4.4a2 2 0 0 1 4 0v.1A1.7 1.7 0 0 0 17.9 6.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9z" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>,
  send: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  x: <><path d="M18 6 6 18M6 6l12 12" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>,
  alert: <><path d="M10.3 4 2.4 17.5a1.9 1.9 0 0 0 1.6 2.9h16a1.9 1.9 0 0 0 1.6-2.9L13.7 4a1.9 1.9 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 17h.01" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></>,
  activity: <><path d="M22 12h-4l-3 8L9 4l-3 8H2" /></>,
  sparkles: <><path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z" /><path d="M5 16l.7 1.9L7.6 18.6l-1.9.7L5 21l-.7-1.7L2.4 18.6l1.9-.7z" /></>,
  chevron: <><path d="M9 6l6 6-6 6" /></>,
  inbox: <><path d="M22 12h-5l-1.5 2.5h-7L7 12H2" /><path d="M5.5 5.6 2.5 12v6a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2v-6l-3-6.4A2 2 0 0 0 16.7 4.5H7.3a2 2 0 0 0-1.8 1.1z" /></>,
  flame: <><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.5.7-2.8 1.5-3.8C9.3 9 9 7 12 3z" /></>,
  starOutline: <><path d="M12 3.2l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.8 6.5 19.8l1.4-6.1L3.2 9.5l6.2-.6z" /></>,
  star: <><path fill="currentColor" stroke="none" d="M12 2.6l2.8 6.1 6.7.6-5 4.5 1.5 6.6L12 17.5 6 20.4l1.5-6.6-5-4.5 6.7-.6z" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
};

export function Icon({
  name,
  size = 20,
  className,
  style,
  strokeWidth = 1.9,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {ICONS[name] ?? null}
    </svg>
  );
}
