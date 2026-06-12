import { useRef, useState, useCallback } from "react";
import {
  Home,
  Mail,
  Calendar,
  Camera,
  Music,
  Settings,
  MessageSquare,
  Map,
  Clock,
  Calculator,
  BookOpen,
  Cloud,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { DRAG_MIME, encodeDragData, decodeDragData, getIcon } from "@/lib/icon-registry";
import DockSettings from "@/components/DockSettings";

interface DockItem {
  id: string;
  icon: LucideIcon;
  label: string;
  iconName: string;
}

const initialMainItems: DockItem[] = [
  { id: "dock-home", icon: Home, label: "Home", iconName: "Home" },
  { id: "dock-mail", icon: Mail, label: "Mail", iconName: "Mail" },
  { id: "dock-messages", icon: MessageSquare, label: "Messages", iconName: "MessageSquare" },
  { id: "dock-calendar", icon: Calendar, label: "Calendar", iconName: "Calendar" },
  { id: "dock-camera", icon: Camera, label: "Photos", iconName: "Camera" },
  { id: "dock-music", icon: Music, label: "Music", iconName: "Music" },
  { id: "dock-maps", icon: Map, label: "Maps", iconName: "Map" },
  { id: "dock-clock", icon: Clock, label: "Clock", iconName: "Clock" },
  { id: "dock-calculator", icon: Calculator, label: "Calculator", iconName: "Calculator" },
  { id: "dock-books", icon: BookOpen, label: "Books", iconName: "BookOpen" },
  { id: "dock-weather", icon: Cloud, label: "Weather", iconName: "Cloud" },
];

const utilityItems: DockItem[] = [
  { id: "dock-settings", icon: Settings, label: "Settings", iconName: "Settings" },
  { id: "dock-trash", icon: Trash2, label: "Bin", iconName: "Trash2" },
];

const BASE_SIZE = 48;
const MAX_SIZE = 80;
const MAGNIFY_RANGE = 150;

const Dock = () => {
  const dockRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const [mainItems, setMainItems] = useState<DockItem[]>(initialMainItems);
  const [isDragOver, setIsDragOver] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (animationsEnabled) {
      setMouseX(e.clientX);
    }
  }, [animationsEnabled]);

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
    setHoveredId(null);
  }, []);

  const getScale = useCallback(
    (itemId: string) => {
      if (!animationsEnabled || mouseX === null) return 1;
      const el = itemRefs.current[itemId];
      if (!el) return 1;
      const rect = el.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const distance = Math.abs(mouseX - itemCenterX);
      if (distance > MAGNIFY_RANGE) return 1;
      const scale = 1 + ((MAX_SIZE - BASE_SIZE) / BASE_SIZE) * (1 - distance / MAGNIFY_RANGE);
      return scale;
    },
    [mouseX, animationsEnabled]
  );

  const handleClick = (id: string) => {
    if (id === "dock-settings") {
      setSettingsOpen((v) => !v);
      return;
    }
    setBouncingId(id);
    setTimeout(() => setBouncingId(null), 600);
  };

  const onDragStart = (e: React.DragEvent, item: DockItem) => {
    const data = encodeDragData({
      id: item.id,
      label: item.label,
      iconName: item.iconName,
      source: "dock",
    });
    e.dataTransfer.setData(DRAG_MIME, data);
    e.dataTransfer.setData("text/plain", data);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);

    const mouseClientX = e.clientX;
    let bestIndex = mainItems.length;

    for (let i = 0; i < mainItems.length; i++) {
      const el = itemRefs.current[mainItems[i].id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (mouseClientX < midX) {
        bestIndex = i;
        break;
      }
    }
    setInsertIndex(bestIndex);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
    setInsertIndex(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropIdx = insertIndex ?? mainItems.length;
    setInsertIndex(null);

    const data = decodeDragData(e);
    if (!data || data.source !== "menu") return;

    const icon = getIcon(data.iconName);
    if (!icon) return;

    const dockId = `dock-${data.id}`;
    if (mainItems.some((i) => i.id === dockId)) return;

    setMainItems((prev) => {
      const newItems = [...prev];
      newItems.splice(dropIdx, 0, { id: dockId, icon, label: data.label, iconName: data.iconName });
      return newItems;
    });
  };

  const onDragEnd = (e: React.DragEvent, item: DockItem) => {
    if (e.dataTransfer.dropEffect === "move") {
      const isUtility = utilityItems.some((u) => u.id === item.id);
      if (!isUtility) {
        setMainItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    }
  };

  const renderItem = (item: DockItem, index: number, isUtilityItem: boolean) => {
    const scale = getScale(item.id);
    const Icon = item.icon;
    const isBouncing = bouncingId === item.id;
    const isBin = item.id === "dock-trash";
    const showInsertGap = insertIndex === index && isDragOver && !isUtilityItem;

    return (
      <div
        key={item.id}
        className="flex items-end"
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
        onDragOver={isBin ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
        onDrop={isBin ? (e) => {
          e.preventDefault();
          e.stopPropagation();
          const data = decodeDragData(e);
          if (!data) return;
          if (data.source === "dock") {
            const isUtil = utilityItems.some((u) => u.id === data.id);
            if (!isUtil) {
              setMainItems((prev) => prev.filter((i) => i.id !== data.id));
            }
          }
        } : undefined}
      >
        {/* Animated insert gap */}
        {!isUtilityItem && (
          <div
            className="flex items-end justify-center overflow-hidden transition-all duration-200 ease-out"
            style={{
              width: showInsertGap ? BASE_SIZE + 8 : 0,
              height: BASE_SIZE,
            }}
          >
            <div
              className="rounded-full bg-primary transition-all duration-200 ease-out"
              style={{
                width: showInsertGap ? 3 : 0,
                height: showInsertGap ? 24 : 0,
                opacity: showInsertGap ? 1 : 0,
                marginBottom: 12,
              }}
            />
          </div>
        )}

        <div className="flex flex-col items-center">
          <button
            ref={(el) => {
              itemRefs.current[item.id] = el;
            }}
            draggable={!isUtilityItem}
            onDragStart={(e) => onDragStart(e, item)}
            onDragEnd={(e) => onDragEnd(e, item)}
            onClick={() => handleClick(item.id)}
            data-tooltip={item.label}
            data-tooltip-placement="top"
            className="tooltip flex items-center justify-center rounded-xl bg-secondary/80 text-foreground transition-colors duration-150 hover:bg-accent/20 cursor-grab active:cursor-grabbing"
            style={{
              width: BASE_SIZE,
              height: BASE_SIZE,
              transform: `scale(${scale})${isBouncing ? " translateY(-16px)" : ""}`,
              transformOrigin: "bottom center",
              transition: isBouncing
                ? "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                : animationsEnabled
                ? "transform 0.15s ease-out"
                : "none",
            }}
          >
            <Icon
              size={BASE_SIZE * 0.5}
              strokeWidth={1.5}
              className="text-foreground"
            />
          </button>
        </div>
      </div>
    );
  };

  // Trailing insert gap (after last main item)
  const showTrailingGap = insertIndex === mainItems.length && isDragOver;

  return (
    <div data-app-dock className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
      <div
        ref={dockRef}
        className={`flex items-end px-3 py-2 rounded-2xl border border-transparent bg-transparent shadow-none transition-colors ${
          isDragOver ? "border-primary/40" : ""
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Main items */}
        <div className="flex items-end gap-1">
          {mainItems.map((item, i) => renderItem(item, i, false))}

          {/* Trailing insert gap */}
          <div
            className="flex items-end justify-center overflow-hidden transition-all duration-200 ease-out"
            style={{
              width: showTrailingGap ? BASE_SIZE + 8 : 0,
              height: BASE_SIZE,
            }}
          >
            <div
              className="rounded-full bg-primary transition-all duration-200 ease-out"
              style={{
                width: showTrailingGap ? 3 : 0,
                height: showTrailingGap ? 24 : 0,
                opacity: showTrailingGap ? 1 : 0,
                marginBottom: 12,
              }}
            />
          </div>
        </div>

        {/* Single separator */}
        <div className="flex items-end pb-2 mx-1">
          <div className="w-px h-10 bg-border" />
        </div>

        {/* Utility items: Settings + Bin */}
        <div className="flex items-end gap-1">
          {utilityItems.map((item, i) => renderItem(item, mainItems.length + i, true))}
        </div>
      </div>

      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-full bg-primary/10 blur-md" />
      <DockSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        animationsEnabled={animationsEnabled}
        onAnimationsChange={setAnimationsEnabled}
      />
    </div>
  );
};

export default Dock;
