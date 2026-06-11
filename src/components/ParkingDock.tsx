import { useEffect, useRef, useState } from "react";

const ParkingDock = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const isDragging = document.body.dataset.menuDragging === "true";
      setDragging(isDragging);
      if (!isDragging) {
        setHovering(false);
        return;
      }
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      setHovering(inside);
    };
    const onUp = () => {
      setDragging(false);
      setHovering(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div
      id="menu-parking-dock"
      ref={ref}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed text-[10px] font-medium uppercase tracking-wider transition-all duration-200 ${
        hovering
          ? "border-primary bg-primary/15 text-primary scale-105"
          : dragging
            ? "border-primary/60 bg-primary/5 text-primary/70"
            : "border-menu-glass-border/60 bg-menu-glass/30 text-muted-foreground/50 backdrop-blur-xl"
      }`}
      style={{ width: 512, height: 56 }}
    >
      Dock
    </div>
  );

};

export default ParkingDock;
