import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type ActiveTooltip = { anchor: Element; text: string };
type Position = { left: number; top: number };

export function GameTooltipLayer() {
  const [active, setActive] = useState<ActiveTooltip | null>(null);
  const [position, setPosition] = useState<Position>({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const positionTooltip = useCallback(() => {
    const panel = tooltipRef.current;
    if (!active || !panel || !active.anchor.isConnected) return;
    const rect = active.anchor.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const gutter = 10;
    const left = Math.max(gutter, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - gutter));
    const above = rect.top - height - gutter;
    const below = rect.bottom + gutter;
    const top = above >= gutter ? above : Math.max(gutter, Math.min(below, window.innerHeight - height - gutter));
    setPosition((previous) => previous.left === left && previous.top === top ? previous : { left, top });
  }, [active]);

  useLayoutEffect(() => {
    if (!active) return;
    positionTooltip();
    const observer = new ResizeObserver(positionTooltip);
    if (tooltipRef.current) observer.observe(tooltipRef.current);
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip, true);
    };
  }, [active, positionTooltip]);

  useEffect(() => {
    const root = document.querySelector('.game-ui');
    if (!root) return;

    const findAnchor = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return null;
      const anchor = target.closest('[title], [data-game-tooltip]');
      return anchor && root.contains(anchor) ? anchor : null;
    };
    const show = (event: Event) => {
      const anchor = findAnchor(event);
      if (!anchor) return;
      const text = anchor.getAttribute('data-game-tooltip') || anchor.getAttribute('title');
      if (!text) return;
      if (anchor.hasAttribute('title')) {
        anchor.setAttribute('data-game-tooltip', text);
        anchor.removeAttribute('title');
      }
      if (anchor.matches('button, [role="button"]') && !anchor.hasAttribute('aria-label')) {
        anchor.setAttribute('aria-label', text);
      }
      setActive((current) => current?.anchor === anchor && current.text === text ? current : { anchor, text });
    };
    const hide = (event: Event) => {
      if (event instanceof PointerEvent && event.relatedTarget instanceof Node) {
        const anchor = findAnchor(event);
        if (anchor?.contains(event.relatedTarget)) return;
      }
      setActive(null);
    };
    const hideOnEscape = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') setActive(null);
    };

    root.addEventListener('pointerover', show);
    root.addEventListener('focusin', show);
    root.addEventListener('pointerout', hide);
    root.addEventListener('focusout', hide);
    root.addEventListener('click', hide);
    root.addEventListener('keydown', hideOnEscape);
    return () => {
      root.removeEventListener('pointerover', show);
      root.removeEventListener('focusin', show);
      root.removeEventListener('pointerout', hide);
      root.removeEventListener('focusout', hide);
      root.removeEventListener('click', hide);
      root.removeEventListener('keydown', hideOnEscape);
    };
  }, []);

  if (!active) return null;
  return createPortal(
    <div ref={tooltipRef} className="game-tooltip" role="tooltip" style={position}>{active.text}</div>,
    document.body,
  );
}
