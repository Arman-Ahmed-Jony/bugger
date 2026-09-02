import type { BuggerSessionMeta, ClickEvent } from "@bugger/shared";

export interface RippleViewport {
  width: number;
  height: number;
}

export interface ActiveRippleInput {
  id: string;
  x: number;
  y: number;
  viewport: RippleViewport;
}

export interface VideoContentRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Painted video frame area inside the <video> element (object-fit aware). */
export function getVideoContentRect(video: HTMLVideoElement): VideoContentRect {
  const rect = video.getBoundingClientRect();
  const intrinsicWidth = video.videoWidth;
  const intrinsicHeight = video.videoHeight;

  if (!intrinsicWidth || !intrinsicHeight || !rect.width || !rect.height) {
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  const objectFit = getComputedStyle(video).objectFit || "contain";
  if (objectFit === "fill") {
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  }

  const scale = Math.min(rect.width / intrinsicWidth, rect.height / intrinsicHeight);
  const width = intrinsicWidth * scale;
  const height = intrinsicHeight * scale;

  return {
    left: rect.left + (rect.width - width) / 2,
    top: rect.top + (rect.height - height) / 2,
    width,
    height,
  };
}

/** CSS-pixel viewport that matches the recorded click coordinate space. */
export function resolveMappingViewport(
  click: ClickEvent,
  meta: BuggerSessionMeta,
  video: HTMLVideoElement,
): RippleViewport {
  if (click.viewportWidth && click.viewportHeight) {
    return { width: click.viewportWidth, height: click.viewportHeight };
  }

  if (meta.captureViewportWidth && meta.captureViewportHeight) {
    return {
      width: meta.captureViewportWidth,
      height: meta.captureViewportHeight,
    };
  }

  const dpr = meta.captureDevicePixelRatio ?? 1;
  const frameWidth = meta.captureVideoWidth ?? video.videoWidth;
  const frameHeight = meta.captureVideoHeight ?? video.videoHeight;

  if (frameWidth > 0 && frameHeight > 0 && dpr > 0) {
    return {
      width: frameWidth / dpr,
      height: frameHeight / dpr,
    };
  }

  return {
    width: frameWidth || 1,
    height: frameHeight || 1,
  };
}

export function mapClickToVideoPosition(
  video: HTMLVideoElement,
  container: HTMLElement,
  clickX: number,
  clickY: number,
  viewport: RippleViewport,
): { left: number; top: number } {
  const content = getVideoContentRect(video);
  const containerRect = container.getBoundingClientRect();

  if (!viewport.width || !viewport.height || !content.width || !content.height) {
    return {
      left: clickX,
      top: clickY,
    };
  }

  const xRatio = Math.min(1, Math.max(0, clickX / viewport.width));
  const yRatio = Math.min(1, Math.max(0, clickY / viewport.height));

  return {
    left: content.left - containerRect.left + xRatio * content.width,
    top: content.top - containerRect.top + yRatio * content.height,
  };
}

export function clicksNearTime(clicks: ClickEvent[], sessionT: number, toleranceMs = 40): ClickEvent[] {
  return clicks.filter((click) => Math.abs(click.t - sessionT) <= toleranceMs);
}

export function clickToRippleInput(
  click: ClickEvent,
  meta: BuggerSessionMeta,
  video: HTMLVideoElement,
): ActiveRippleInput {
  return {
    id: `${click.t}-${click.x}-${click.y}-${Math.random().toString(36).slice(2, 8)}`,
    x: click.x,
    y: click.y,
    viewport: resolveMappingViewport(click, meta, video),
  };
}
