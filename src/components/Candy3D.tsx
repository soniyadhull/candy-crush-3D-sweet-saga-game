import React from 'react';
import { CandyColor, SpecialType } from '../types';

interface Candy3DProps {
  color: CandyColor;
  special: SpecialType;
  isSelected?: boolean;
  isHint?: boolean;
  isMatched?: boolean;
  isDropping?: boolean;
  dropDistance?: number;
  isDragging?: boolean;
  dragOffset?: { x: number; y: number };
  swapVector?: { dc: number; dr: number; isInvalid?: boolean };
  size?: number | string;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const Candy3D: React.FC<Candy3DProps> = ({
  color,
  special,
  isSelected = false,
  isHint = false,
  isMatched = false,
  isDropping = false,
  dropDistance = 1,
  isDragging = false,
  dragOffset,
  swapVector,
  size = '100%',
  onClick,
  onPointerDown
}) => {
  const isColorBomb = special === 'color_bomb';

  // Smooth transform computation with jelly squash & stretch
  let transformStr = '';
  let transitionStr = 'transform 0.16s cubic-bezier(0.25, 1, 0.5, 1)';
  let zIndexVal = 10;

  if (isDragging && dragOffset) {
    // 60fps instant finger tracking with a tactile 3D tilt & jelly elasticity
    const tilt = Math.max(-12, Math.min(12, dragOffset.x * 0.28));
    const isHoriz = Math.abs(dragOffset.x) >= Math.abs(dragOffset.y);
    const stretch = Math.min(0.22, Math.hypot(dragOffset.x, dragOffset.y) / 180);
    const scaleX = (isHoriz ? 1.15 + stretch : 1.12 - stretch * 0.5).toFixed(3);
    const scaleY = (isHoriz ? 1.12 - stretch * 0.5 : 1.15 + stretch).toFixed(3);
    transformStr = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 35px) scale(${scaleX}, ${scaleY}) rotate(${tilt}deg)`;
    transitionStr = 'none';
    zIndexVal = 40;
  } else if (dragOffset) {
    // Neighbor candy smoothly sliding out of the way with soft squish
    transformStr = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 20px) scale(0.95)`;
    transitionStr = 'none';
    zIndexVal = 25;
  } else if (swapVector) {
    // Responsive grid-gap aware swap animation with bouncy jelly curve
    const mult = swapVector.isInvalid ? 0.42 : 1;
    transformStr = `translate3d(calc(${swapVector.dc * mult} * (100% + 5px)), calc(${swapVector.dr * mult} * (100% + 5px)), 25px)`;
    transitionStr = swapVector.isInvalid
      ? 'transform 0.14s cubic-bezier(0.2, 0.9, 0.3, 1)'
      : 'transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1)';
    zIndexVal = 30;
  } else if (isSelected) {
    transformStr = 'translate3d(0, 0, 24px) scale(1.18)';
    zIndexVal = 30;
  }

  const customStyle: React.CSSProperties = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    touchAction: 'none',
    userSelect: 'none',
    zIndex: zIndexVal,
    ...(transformStr ? { transform: transformStr } : {}),
    ...(transitionStr ? { transition: transitionStr } : {}),
    ...(isDropping ? ({ '--drop-units': dropDistance } as React.CSSProperties) : {})
  };

  // Render authentic translucent, glossy, squishy JELLY candy SVG
  const renderCandyShape = () => {
    if (isColorBomb) {
      // Color Bomb: Shimmering Rainbow Jelly Truffle
      return (
        <svg viewBox="0 0 54 54" className="w-full h-full filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]">
          <defs>
            <radialGradient id="grad-choco-jelly" cx="35%" cy="32%" r="72%">
              <stop offset="0%" stopColor="#8d5b4c" />
              <stop offset="35%" stopColor="#4e342e" />
              <stop offset="75%" stopColor="#271c19" />
              <stop offset="100%" stopColor="#120c0a" />
            </radialGradient>
            <radialGradient id="grad-rainbow-jelly" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="transparent" />
              <stop offset="85%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </radialGradient>
            <linearGradient id="grad-jelly-rainbow-streak" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#eab308" stopOpacity="0.8" />
              <stop offset="65%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Pulsing Chromatic Jelly Aura */}
          <circle cx="27" cy="27" r="23" fill="url(#grad-rainbow-jelly)" className="animate-spin" style={{ animationDuration: '8s' }} />

          {/* Jelly Truffle Base Sphere */}
          <circle cx="27" cy="27" r="20" fill="url(#grad-choco-jelly)" stroke="#d97706" strokeWidth="1.2" strokeOpacity="0.7" />

          {/* Swirling Translucent Jelly Ribbon */}
          <ellipse cx="27" cy="27" rx="19" ry="11" fill="none" stroke="url(#grad-jelly-rainbow-streak)" strokeWidth="2.5" opacity="0.65" transform="rotate(-25 27 27)" />

          {/* Wet Jelly Specular Glaze */}
          <path d="M 18 11 C 24 8, 33 9, 37 13 C 34 11, 24 10, 18 13 Z" fill="#ffffff" opacity="0.75" />
          <circle cx="16" cy="16" r="1.5" fill="#ffffff" opacity="0.9" />

          {/* Glistening 3D Jelly Sugar Crystals & Sprinkles */}
          <circle cx="16" cy="21" r="2.5" fill="#f43f5e" stroke="#fff" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
          <circle cx="34" cy="18" r="2.4" fill="#eab308" stroke="#fff" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
          <circle cx="21" cy="35" r="2.5" fill="#10b981" stroke="#fff" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
          <circle cx="35" cy="33" r="2.5" fill="#0ea5e9" stroke="#fff" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
          <circle cx="15" cy="30" r="2.2" fill="#f97316" stroke="#fff" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
          <circle cx="26" cy="15" r="2.3" fill="#ec4899" stroke="#fff" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
          <circle cx="38" cy="25" r="2.2" fill="#a855f7" stroke="#fff" strokeWidth="0.6" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))" />
          <circle cx="27" cy="27" r="2.6" fill="#ffffff" stroke="#fef08a" strokeWidth="0.8" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.9))" />

          {/* Center Spinning Gold Star */}
          <path
            d="M 27 21 L 28.5 25 L 32.5 25.5 L 29.5 28.2 L 30.5 32.2 L 27 30 L 23.5 32.2 L 24.5 28.2 L 21.5 25.5 L 25.5 25 Z"
            fill="#fde047"
            stroke="#b45309"
            strokeWidth="0.5"
            className="animate-spin"
            style={{ animationDuration: '6s', transformOrigin: '27px 27px' }}
          />
        </svg>
      );
    }

    switch (color) {
      case 'red':
        // RED: Juicy Strawberry Jelly Heart / Gumdrop Dome
        return (
          <svg viewBox="0 0 54 54" className="w-full h-full filter drop-shadow-[0_7px_14px_rgba(225,29,72,0.6)]">
            <defs>
              <radialGradient id="grad-red-jelly-base" cx="36%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#ff758f" />
                <stop offset="25%" stopColor="#f43f5e" />
                <stop offset="65%" stopColor="#be123c" />
                <stop offset="100%" stopColor="#700926" />
              </radialGradient>
              <radialGradient id="grad-red-jelly-core" cx="45%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.8" />
                <stop offset="45%" stopColor="#fb7185" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#9f1239" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Translucent Jelly Body */}
            <path
              d="M 19 9 C 27 6, 44 10, 45 22 C 46 34, 38 45, 27 46 C 15 47, 8 40, 8 28 C 8 17, 12 11, 19 9 Z"
              fill="url(#grad-red-jelly-base)"
              stroke="#fecdd3"
              strokeWidth="1.4"
              strokeOpacity="0.9"
            />

            {/* Glowing Translucent Fruit Gel Core */}
            <path
              d="M 21 14 C 28 12, 39 15, 40 23 C 41 31, 35 39, 27 40 C 18 41, 14 36, 14 27 C 14 19, 17 14, 21 14 Z"
              fill="url(#grad-red-jelly-core)"
            />

            {/* Internal Jelly Bubbles / Seed Reflections */}
            <circle cx="23" cy="28" r="1.4" fill="#ffffff" opacity="0.5" />
            <circle cx="32" cy="24" r="1.2" fill="#ffffff" opacity="0.4" />
            <circle cx="28" cy="34" r="1.5" fill="#fda4af" opacity="0.6" />

            {/* Primary Curved Wet Jelly Specular Glaze */}
            <path
              d="M 18 12 C 24 9, 35 12, 38 18 C 34 15, 25 12, 19 15 C 18 14, 17 13, 18 12 Z"
              fill="#ffffff"
              opacity="0.92"
            />

            {/* Secondary Jelly Droplet Glint */}
            <circle cx="16" cy="18" r="2.2" fill="#ffffff" opacity="0.95" />
            <circle cx="20" cy="13" r="1.2" fill="#ffffff" opacity="0.8" />

            {/* Bottom Translucent Jelly Caustic Rim */}
            <path
              d="M 18 42 C 24 44, 33 43, 36 39 C 32 41, 24 42, 18 41 Z"
              fill="#fda4af"
              opacity="0.85"
            />
          </svg>
        );

      case 'orange':
        // ORANGE: Juicy Tangerine Slice / Citrus Gummy Lozenge
        return (
          <svg viewBox="0 0 54 54" className="w-full h-full filter drop-shadow-[0_7px_14px_rgba(249,115,22,0.6)]">
            <defs>
              <radialGradient id="grad-orange-jelly" cx="36%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#ffc078" />
                <stop offset="30%" stopColor="#f97316" />
                <stop offset="70%" stopColor="#c2410c" />
                <stop offset="100%" stopColor="#682106" />
              </radialGradient>
              <radialGradient id="grad-orange-jelly-glow" cx="45%" cy="38%" r="58%">
                <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#fed7aa" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Smooth Rounded Gummy Hexagon Body (Not sharp polygon) */}
            <path
              d="M 27 7 C 32 7, 44 14, 45 19 C 46 24, 46 30, 45 35 C 44 40, 32 47, 27 47 C 22 47, 10 40, 9 35 C 8 30, 8 24, 9 19 C 10 14, 22 7, 27 7 Z"
              fill="url(#grad-orange-jelly)"
              stroke="#fed7aa"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />

            {/* Juicy Inner Translucent Gel Pulp Dome */}
            <path
              d="M 27 12 C 31 12, 39 17, 40 21 C 41 25, 41 29, 40 33 C 39 37, 31 42, 27 42 C 23 42, 15 37, 14 33 C 13 29, 13 25, 14 21 C 15 17, 23 12, 27 12 Z"
              fill="url(#grad-orange-jelly-glow)"
            />

            {/* Gelatinous Pulp Segments / Caustics */}
            <ellipse cx="27" cy="27" rx="10" ry="7" fill="#fb923c" opacity="0.45" />
            <circle cx="21" cy="25" r="1.4" fill="#ffffff" opacity="0.5" />
            <circle cx="33" cy="29" r="1.3" fill="#ffffff" opacity="0.4" />

            {/* Curved Wet Gel Reflection */}
            <path
              d="M 22 11 C 28 9, 36 12, 39 16 C 36 13, 27 11, 21 14 Z"
              fill="#ffffff"
              opacity="0.92"
            />
            <circle cx="22" cy="15" r="2.2" fill="#ffffff" opacity="0.95" />
            <circle cx="27" cy="12" r="1.3" fill="#ffffff" opacity="0.8" />

            {/* Bottom Warm Translucent Glow */}
            <path
              d="M 18 41 C 23 44, 31 44, 36 41 C 32 42.5, 22 42.5, 18 41 Z"
              fill="#fed7aa"
              opacity="0.85"
            />
          </svg>
        );

      case 'yellow':
        // YELLOW: Plump Lemon Gumdrop / Honey Jelly Drop
        return (
          <svg viewBox="0 0 54 54" className="w-full h-full filter drop-shadow-[0_7px_14px_rgba(234,179,8,0.65)]">
            <defs>
              <radialGradient id="grad-yellow-jelly" cx="35%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="25%" stopColor="#fef08a" />
                <stop offset="55%" stopColor="#facc15" />
                <stop offset="85%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </radialGradient>
              <radialGradient id="grad-yellow-jelly-core" cx="45%" cy="38%" r="55%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#fef08a" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Plump Translucent Teardrop Gumdrop Body */}
            <path
              d="M 27 7 C 37 16, 46 25, 45 35 C 44 44, 36 47, 27 47 C 18 47, 10 44, 9 35 C 8 25, 17 16, 27 7 Z"
              fill="url(#grad-yellow-jelly)"
              stroke="#fef9c3"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />

            {/* Glowing Golden Jelly Center */}
            <ellipse cx="27" cy="33" rx="13" ry="10" fill="url(#grad-yellow-jelly-core)" />

            {/* Jelly Seed / Air Bubbles */}
            <circle cx="23" cy="32" r="1.5" fill="#ffffff" opacity="0.6" />
            <circle cx="31" cy="35" r="1.3" fill="#ffffff" opacity="0.5" />

            {/* Glassy Specular Light Curve */}
            <path
              d="M 26 10 C 32 16, 39 24, 39 31 C 37 25, 30 19, 25 15 Z"
              fill="#ffffff"
              opacity="0.92"
            />
            <circle cx="24" cy="17" r="2.2" fill="#ffffff" opacity="0.95" />
            <circle cx="27" cy="12" r="1.4" fill="#ffffff" opacity="0.8" />

            {/* Bottom Honey Caustic Bounce Glow */}
            <path
              d="M 18 43 C 24 45.5, 30 45.5, 36 43 C 31 44.5, 23 44.5, 18 43 Z"
              fill="#fef08a"
              opacity="0.9"
            />
          </svg>
        );

      case 'green':
        // GREEN: Sour Apple Gummy Pillow / Lime Jelly Cushion
        return (
          <svg viewBox="0 0 54 54" className="w-full h-full filter drop-shadow-[0_7px_14px_rgba(16,185,129,0.6)]">
            <defs>
              <radialGradient id="grad-green-jelly" cx="35%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="28%" stopColor="#34d399" />
                <stop offset="65%" stopColor="#10b981" />
                <stop offset="88%" stopColor="#047857" />
                <stop offset="100%" stopColor="#064e3b" />
              </radialGradient>
              <radialGradient id="grad-green-jelly-core" cx="45%" cy="38%" r="58%">
                <stop offset="0%" stopColor="#ecfdf5" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#6ee7b7" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Soft Translucent Gummy Pillow Body */}
            <rect
              x="8"
              y="8"
              width="38"
              height="38"
              rx="13"
              ry="13"
              fill="url(#grad-green-jelly)"
              stroke="#a7f3d0"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />

            {/* Inner Translucent Gel Cushion Dome */}
            <rect
              x="13"
              y="13"
              width="28"
              height="28"
              rx="9"
              ry="9"
              fill="url(#grad-green-jelly-core)"
            />

            {/* Diagonal Refraction Caustic Band */}
            <path
              d="M 13 20 C 20 13, 30 23, 40 33 C 33 40, 23 30, 13 20 Z"
              fill="#ffffff"
              opacity="0.22"
            />

            {/* Air Bubbles inside Gummy */}
            <circle cx="21" cy="27" r="1.5" fill="#ffffff" opacity="0.5" />
            <circle cx="32" cy="23" r="1.3" fill="#ffffff" opacity="0.45" />

            {/* Top-Left Glossy Jelly Reflection */}
            <ellipse
              cx="17"
              cy="16"
              rx="5.5"
              ry="3"
              transform="rotate(-30 17 16)"
              fill="#ffffff"
              opacity="0.92"
            />
            <circle cx="23" cy="14" r="1.5" fill="#ffffff" opacity="0.85" />

            {/* Bottom Translucent Rim Light */}
            <path
              d="M 15 42 C 22 44, 32 44, 39 42 C 34 43, 20 43, 15 42 Z"
              fill="#a7f3d0"
              opacity="0.8"
            />
          </svg>
        );

      case 'blue':
        // BLUE: Blue Raspberry Dewdrop / Ocean Jelly Marble
        return (
          <svg viewBox="0 0 54 54" className="w-full h-full filter drop-shadow-[0_7px_14px_rgba(37,99,235,0.6)]">
            <defs>
              <radialGradient id="grad-blue-jelly" cx="34%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="25%" stopColor="#38bdf8" />
                <stop offset="55%" stopColor="#2563eb" />
                <stop offset="85%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#0f172a" />
              </radialGradient>
              <radialGradient id="grad-blue-jelly-core" cx="45%" cy="38%" r="55%">
                <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* 3D Translucent Jelly Sphere Body */}
            <circle
              cx="27"
              cy="27"
              r="19"
              fill="url(#grad-blue-jelly)"
              stroke="#bae6fd"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />

            {/* Glowing Translucent Inner Water Core */}
            <circle cx="27" cy="27" r="14" fill="url(#grad-blue-jelly-core)" />

            {/* Internal Bubble Sparkles */}
            <circle cx="22" cy="28" r="1.5" fill="#ffffff" opacity="0.55" />
            <circle cx="32" cy="24" r="1.3" fill="#ffffff" opacity="0.45" />

            {/* Top Specular Curved Jelly Glaze */}
            <ellipse
              cx="21"
              cy="18"
              rx="7.5"
              ry="4.2"
              transform="rotate(-28 21 18)"
              fill="#ffffff"
              opacity="0.92"
            />
            <circle cx="29" cy="16" r="1.8" fill="#ffffff" opacity="0.85" />

            {/* Bottom Caustic Glow Reflection */}
            <path
              d="M 17 41 C 23 44.5, 31 44.5, 37 41 C 32 42.8, 22 42.8, 17 41 Z"
              fill="#bfdbfe"
              opacity="0.85"
            />
          </svg>
        );

      case 'purple':
        // PURPLE: Royal Grape Jelly Jewel / Blackberry Gummy Gumdrop
        return (
          <svg viewBox="0 0 54 54" className="w-full h-full filter drop-shadow-[0_7px_14px_rgba(168,85,247,0.6)]">
            <defs>
              <radialGradient id="grad-purple-jelly" cx="35%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#f5d0fe" />
                <stop offset="28%" stopColor="#e879f9" />
                <stop offset="60%" stopColor="#a855f7" />
                <stop offset="85%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#3b0764" />
              </radialGradient>
              <radialGradient id="grad-purple-jelly-core" cx="45%" cy="38%" r="58%">
                <stop offset="0%" stopColor="#fdf4ff" stopOpacity="0.85" />
                <stop offset="55%" stopColor="#f0abfc" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            {/* Soft Rounded Amethyst Gumdrop / Jelly Lozenge (Smooth curves!) */}
            <path
              d="M 27 7 C 36 7, 44 14, 45 22 C 45 32, 38 43, 27 47 C 16 43, 9 32, 9 22 C 10 14, 18 7, 27 7 Z"
              fill="url(#grad-purple-jelly)"
              stroke="#f5d0fe"
              strokeWidth="1.5"
              strokeOpacity="0.9"
            />

            {/* Glowing Translucent Grape Syrup Center */}
            <ellipse cx="27" cy="27" rx="13" ry="12" fill="url(#grad-purple-jelly-core)" />

            {/* Internal Gelatinous Sparkles & Air Bubbles */}
            <circle cx="23" cy="26" r="1.5" fill="#ffffff" opacity="0.55" />
            <circle cx="31" cy="29" r="1.3" fill="#ffffff" opacity="0.45" />

            {/* Top Glossy Curved Reflection */}
            <path
              d="M 22 11 C 28 9, 36 12, 38 17 C 35 14, 27 12, 21 15 Z"
              fill="#ffffff"
              opacity="0.92"
            />
            <circle cx="22" cy="16" r="2.2" fill="#ffffff" opacity="0.95" />
            <circle cx="27" cy="12" r="1.4" fill="#ffffff" opacity="0.8" />

            {/* Bottom Magenta Bounce Light */}
            <path
              d="M 18 43 C 23 45.5, 31 45.5, 36 43 C 32 44.5, 22 44.5, 18 43 Z"
              fill="#f5d0fe"
              opacity="0.85"
            />
          </svg>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={customStyle}
      className={`relative flex items-center justify-center select-none cursor-pointer will-change-transform ${
        isMatched ? 'candy-popping' : ''
      } ${isDropping ? 'candy-dropping' : ''} ${isHint ? 'candy-hint' : ''} ${
        !isDragging && !swapVector && !isSelected ? 'hover:scale-105 active:scale-95' : ''
      }`}
    >
      {/* 3D Floor Shadow */}
      <div
        className="absolute inset-1 rounded-full opacity-65 filter blur-[3px] pointer-events-none transition-transform"
        style={{
          background: isColorBomb
            ? 'radial-gradient(circle, rgba(217,70,239,0.6) 0%, rgba(0,0,0,0.7) 100%)'
            : 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 80%)',
          transform: isSelected || isDragging ? 'translateY(10px) scale(1.15)' : 'translateY(3.5px)',
        }}
      />

      {/* Selected Neon Ring */}
      {isSelected && (
        <div className="absolute -inset-1 rounded-full border-2 border-white/95 animate-ping opacity-80 pointer-events-none" />
      )}

      {/* The 3D Candy Silhouette Body */}
      <div className="relative w-[92%] h-[92%] flex items-center justify-center">
        {renderCandyShape()}

        {/* ============================================================ */}
        {/* SPECIAL CANDY OVERLAYS: STRIPED CANDY & WRAPPED CANDY        */}
        {/* ============================================================ */}
        {special === 'striped_h' && (
          <div className="absolute inset-0 flex flex-col justify-around py-2.5 pointer-events-none">
            <div className="h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.95)] opacity-95" />
            <div className="h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.95)] opacity-95" />
            <div className="h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.95)] opacity-95" />
          </div>
        )}

        {special === 'striped_v' && (
          <div className="absolute inset-0 flex flex-row justify-around px-2.5 pointer-events-none">
            <div className="w-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.95)] opacity-95" />
            <div className="w-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.95)] opacity-95" />
            <div className="w-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.95)] opacity-95" />
          </div>
        )}

        {special === 'wrapped' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Cellophane Candy Wrapper Tips */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white/70 rotate-45 rounded-sm border border-white filter blur-[0.5px]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/70 -rotate-45 rounded-sm border border-white filter blur-[0.5px]" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/70 -rotate-45 rounded-sm border border-white filter blur-[0.5px]" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/70 rotate-45 rounded-sm border border-white filter blur-[0.5px]" />
            
            {/* Golden Star Badge */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-white shadow-md flex items-center justify-center animate-pulse">
              <span className="text-[11px] font-black text-amber-950">★</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
