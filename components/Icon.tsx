import { memo } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'search'
  | 'map'
  | 'home'
  | 'cal'
  | 'heart'
  | 'user'
  | 'chev'
  | 'chevL'
  | 'chevD'
  | 'plus'
  | 'x'
  | 'check'
  | 'bell'
  | 'settings'
  | 'pin'
  | 'clock'
  | 'phone'
  | 'edit'
  | 'trash'
  | 'filter'
  | 'arrow'
  | 'arrowL'
  | 'camera'
  | 'image'
  | 'upload'
  | 'eye'
  | 'lock'
  | 'moon'
  | 'globe'
  | 'info'
  | 'wifiOff'
  | 'sparkle'
  | 'razor'
  | 'scissors'
  | 'comb'
  | 'star'
  | 'swipe'
  | 'grid'
  | 'list'
  | 'dot'
  | 'mirror';

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Stroke width — design uses 1.4–1.5 by default, 0 for filled icons (heart, star). */
  sw?: number;
};

/**
 * Lucide-style 1.5px line icons, ported from the design system.
 * Path data lives in `tokens.jsx:74-118` of the handoff.
 */
export const Icon = memo(function Icon({
  name,
  size = 20,
  color = 'currentColor',
  sw = 1.5,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={sw === 0 ? color : 'none'}
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {renderPath(name, color)}
    </Svg>
  );
});

function renderPath(name: IconName, color: string) {
  switch (name) {
    case 'search':
      return (
        <>
          <Circle cx="11" cy="11" r="7" />
          <Path d="m20 20-3.5-3.5" />
        </>
      );
    case 'map':
      return (
        <>
          <Path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z" />
          <Path d="M9 3v16M15 5v16" />
        </>
      );
    case 'home':
      return <Path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z" />;
    case 'cal':
      return (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="2" />
          <Path d="M3 9h18M8 3v4M16 3v4" />
        </>
      );
    case 'heart':
      return <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />;
    case 'user':
      return (
        <>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21a8 8 0 0 1 16 0" />
        </>
      );
    case 'chev':
      return <Path d="m9 6 6 6-6 6" />;
    case 'chevL':
      return <Path d="m15 6-6 6 6 6" />;
    case 'chevD':
      return <Path d="m6 9 6 6 6-6" />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" />;
    case 'x':
      return <Path d="M6 6 18 18M18 6 6 18" />;
    case 'check':
      return <Path d="m5 12 5 5L20 7" />;
    case 'bell':
      return (
        <>
          <Path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
          <Path d="M10 21a2 2 0 0 0 4 0" />
        </>
      );
    case 'settings':
      return (
        <>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </>
      );
    case 'pin':
      return (
        <>
          <Path d="M12 21s-7-7-7-12a7 7 0 0 1 14 0c0 5-7 12-7 12Z" />
          <Circle cx="12" cy="9" r="2.5" />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </>
      );
    case 'phone':
      return (
        <Path d="M22 16v3a2 2 0 0 1-2 2 19 19 0 0 1-17-17 2 2 0 0 1 2-2h3a2 2 0 0 1 2 2c0 1 .2 2 .5 3a2 2 0 0 1-.5 2L8.5 9.5a16 16 0 0 0 6 6l1.5-1.5a2 2 0 0 1 2-.5c1 .3 2 .5 3 .5a2 2 0 0 1 2 2Z" />
      );
    case 'edit':
      return (
        <>
          <Path d="M11 4H4v16h16v-7" />
          <Path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
        </>
      );
    case 'trash':
      return (
        <Path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
      );
    case 'filter':
      return <Path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z" />;
    case 'arrow':
      return <Path d="M5 12h14M13 5l7 7-7 7" />;
    case 'arrowL':
      return <Path d="M19 12H5M11 5 4 12l7 7" />;
    case 'camera':
      return (
        <>
          <Path d="M3 7h4l2-3h6l2 3h4v13H3V7Z" />
          <Circle cx="12" cy="13" r="4" />
        </>
      );
    case 'image':
      return (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="2" />
          <Circle cx="9" cy="9" r="2" />
          <Path d="m21 15-5-5L5 21" />
        </>
      );
    case 'upload':
      return <Path d="M12 16V4m-5 5 5-5 5 5M4 20h16" />;
    case 'eye':
      return (
        <>
          <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <Circle cx="12" cy="12" r="3" />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x="4" y="11" width="16" height="10" rx="2" />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      );
    case 'moon':
      return <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />;
    case 'globe':
      return (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 8v.01M11 12h1v5h1" />
        </>
      );
    case 'wifiOff':
      return (
        <>
          <Path d="M2 8.5C5 6 8.5 4.5 12 4.5M22 8.5a14 14 0 0 0-4-2.6M5 12.5a10 10 0 0 1 4-2.5M16 12a6 6 0 0 0-3-1M9 16.5a3 3 0 0 1 5 0M2 2l20 20" />
        </>
      );
    case 'sparkle':
      return (
        <Path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2" />
      );
    case 'razor':
      return (
        <>
          <Path d="M5 3h6l1 5H4l1-5Z" />
          <Path d="M8 8v8M5 16h6l-1 5H6l-1-5Z" />
        </>
      );
    case 'scissors':
      return (
        <>
          <Circle cx="6" cy="6" r="3" />
          <Circle cx="6" cy="18" r="3" />
          <Path d="m9 6 12 12M9 18l12-12" />
        </>
      );
    case 'comb':
      return (
        <>
          <Rect x="3" y="9" width="18" height="6" rx="1" />
          <Path d="M7 15v4M11 15v4M15 15v4M19 15v4" />
        </>
      );
    case 'star':
      return <Path d="m12 3 2.7 5.5L21 9.5l-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-1L12 3Z" />;
    case 'swipe':
      return (
        <>
          <Path d="M9 12h12M21 12l-3-3M21 12l-3 3" />
          <Path d="M3 4v16" />
        </>
      );
    case 'grid':
      return (
        <G>
          <Rect x="3" y="3" width="7" height="7" />
          <Rect x="14" y="3" width="7" height="7" />
          <Rect x="3" y="14" width="7" height="7" />
          <Rect x="14" y="14" width="7" height="7" />
        </G>
      );
    case 'list':
      return <Path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
    case 'dot':
      return <Circle cx="12" cy="12" r="3" fill={color} stroke="none" />;
    case 'mirror':
      return (
        <>
          <Rect x="6" y="3" width="12" height="16" rx="6" />
          <Path d="M9 21h6M12 19v2" />
        </>
      );
    default:
      return null;
  }
}
