"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  html: string;
  css: string;
  /** The viewport width the template is laid out at; it is scaled down to fit. */
  width: number;
  /** Clip tall previews (thumbnails); the page preview shows everything. */
  maxHeight?: number;
  title: string;
};

/**
 * Renders generated markup in a shadow root: template CSS cannot leak into the app, and the
 * self-hosted fonts declared by the document stay available. The preview is inert (no links,
 * focus or form input) and scaled so the layout keeps its real breakpoints.
 */
export default function KitPreviewFrame({ html, css, width, maxHeight, title }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const root = element.shadowRoot ?? element.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = css;
    const page = document.createElement("div");
    page.className = "bsp";
    // Markup comes from the kit renderer, which escapes text and allows only safe URLs.
    page.innerHTML = html;
    root.replaceChildren(style, page);
  }, [html, css]);

  useEffect(() => {
    const box = outer.current, content = host.current;
    if (!box || !content) return;
    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, box.clientWidth / width));
      setHeight(content.offsetHeight);
    });
    observer.observe(box);
    observer.observe(content);
    return () => observer.disconnect();
  }, [width]);

  const visible = height * scale;
  return <div ref={outer} role="img" aria-label={title} className="relative w-full overflow-hidden" style={{ height: maxHeight ? Math.min(visible, maxHeight) : visible }}>
    <div ref={host} inert style={{ width, transform: `scale(${scale})`, transformOrigin: "0 0", position: "absolute", left: scale < 1 ? 0 : `calc(50% - ${width / 2}px)`, top: 0, pointerEvents: "none" }}/>
  </div>;
}
