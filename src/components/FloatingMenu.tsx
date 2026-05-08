import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Home, Search, Bell, Heart, User, Settings, MoreHorizontal,
  Mail, Bookmark, Share2, Camera, Zap, Globe, Music, Video, Image,
  FileText, Folder, Archive, Cloud, Lock, Unlock, Star, Sun, Moon,
  Coffee, Gift, Award, Target, Flag, Map, Compass, Wifi, Battery,
  Monitor, Smartphone, Tablet, Watch, Headphones, Mic, Volume2,
  Download, Upload, Printer, Trash2, Edit, Eye, X, GripVertical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DRAG_MIME, encodeDragData, decodeDragData, getIcon } from "@/lib/icon-registry";

interface MenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  iconName: string;
}

const allItems: MenuItem[] = [
  { id: "home", icon: Home, label: "Home", iconName: "Home" },
  { id: "search", icon: Search, label: "Search", iconName: "Search" },
  { id: "bell", icon: Bell, label: "Notifications", iconName: "Bell" },
  { id: "heart", icon: Heart, label: "Favorites", iconName: "Heart" },
  { id: "mail", icon: Mail, label: "Messages", iconName: "Mail" },
  { id: "user", icon: User, label: "Profile", iconName: "User" },
  { id: "settings", icon: Settings, label: "Settings", iconName: "Settings" },
  { id: "bookmark", icon: Bookmark, label: "Bookmarks", iconName: "Bookmark" },
  { id: "share", icon: Share2, label: "Share", iconName: "Share2" },
  { id: "camera", icon: Camera, label: "Camera", iconName: "Camera" },
  { id: "zap", icon: Zap, label: "Quick Actions", iconName: "Zap" },
  { id: "globe", icon: Globe, label: "Globe", iconName: "Globe" },
  { id: "music", icon: Music, label: "Music", iconName: "Music" },
  { id: "video", icon: Video, label: "Video", iconName: "Video" },
  { id: "image", icon: Image, label: "Images", iconName: "Image" },
  { id: "filetext", icon: FileText, label: "Documents", iconName: "FileText" },
  { id: "folder", icon: Folder, label: "Folders", iconName: "Folder" },
  { id: "archive", icon: Archive, label: "Archive", iconName: "Archive" },
  { id: "cloud", icon: Cloud, label: "Cloud", iconName: "Cloud" },
  { id: "lock", icon: Lock, label: "Lock", iconName: "Lock" },
  { id: "unlock", icon: Unlock, label: "Unlock", iconName: "Unlock" },
  { id: "star", icon: Star, label: "Starred", iconName: "Star" },
  { id: "sun", icon: Sun, label: "Light Mode", iconName: "Sun" },
  { id: "moon", icon: Moon, label: "Dark Mode", iconName: "Moon" },
  { id: "coffee", icon: Coffee, label: "Break", iconName: "Coffee" },
  { id: "gift", icon: Gift, label: "Gifts", iconName: "Gift" },
  { id: "award", icon: Award, label: "Awards", iconName: "Award" },
  { id: "target", icon: Target, label: "Goals", iconName: "Target" },
  { id: "flag", icon: Flag, label: "Flagged", iconName: "Flag" },
  { id: "map", icon: Map, label: "Maps", iconName: "Map" },
  { id: "compass", icon: Compass, label: "Navigate", iconName: "Compass" },
  { id: "wifi", icon: Wifi, label: "Network", iconName: "Wifi" },
  { id: "battery", icon: Battery, label: "Battery", iconName: "Battery" },
  { id: "monitor", icon: Monitor, label: "Desktop", iconName: "Monitor" },
  { id: "smartphone", icon: Smartphone, label: "Mobile", iconName: "Smartphone" },
  { id: "tablet", icon: Tablet, label: "Tablet", iconName: "Tablet" },
  { id: "watch", icon: Watch, label: "Watch", iconName: "Watch" },
  { id: "headphones", icon: Headphones, label: "Audio", iconName: "Headphones" },
  { id: "mic", icon: Mic, label: "Microphone", iconName: "Mic" },
  { id: "volume", icon: Volume2, label: "Volume", iconName: "Volume2" },
  { id: "download", icon: Download, label: "Downloads", iconName: "Download" },
  { id: "upload", icon: Upload, label: "Uploads", iconName: "Upload" },
  { id: "printer", icon: Printer, label: "Print", iconName: "Printer" },
  { id: "trash", icon: Trash2, label: "Trash", iconName: "Trash2" },
  { id: "edit", icon: Edit, label: "Edit", iconName: "Edit" },
  { id: "eye", icon: Eye, label: "Preview", iconName: "Eye" },
  { id: "zap2", icon: Zap, label: "Power", iconName: "Zap" },
];

const MAX_PINNED = 8;
const ITEM_SLOT_SIZE = 36; // width of a toolbar item + gap for animation
const DEFAULT_PINNED_IDS = ["home", "search", "bell", "heart", "mail", "user", "settings", "bookmark"];
const TRIGGER_SIZE = 44;
const PALETTE_COLS = 8;
const PALETTE_GAP = 4;
const PALETTE_PAD = 12;

const FloatingMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("home");
  const [pinnedIds, setPinnedIds] = useState<string[]>(DEFAULT_PINNED_IDS);
  const [extraItems, setExtraItems] = useState<MenuItem[]>([]);
  const [paletteOrder, setPaletteOrder] = useState<string[]>(
    allItems.filter((item) => !DEFAULT_PINNED_IDS.includes(item.id)).map((item) => item.id)
  );
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Combined item lookup (static + dynamic from dock)
  const allKnownItems = useMemo(() => [...allItems, ...extraItems], [extraItems]);
  const findItem = useCallback((id: string) => allKnownItems.find((i) => i.id === id), [allKnownItems]);

  // Drag-and-drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dropMode, setDropMode] = useState<"replace" | "insert">("insert");
  const [dropOnPalette, setDropOnPalette] = useState(false);

  // Palette-level DnD state
  const [paletteDropIndex, setPaletteDropIndex] = useState<number | null>(null);
  const [paletteDropMode, setPaletteDropMode] = useState<"replace" | "insert">("insert");

  // Direction states
  const [paletteAbove, setPaletteAbove] = useState(false);
  const [toolbarAbove, setToolbarAbove] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);

  // Menu position drag state
  const [pos, setPos] = useState({ x: 24, y: 300 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const pinnedItems = useMemo(
    () => pinnedIds.map((id) => findItem(id)!).filter(Boolean),
    [pinnedIds, findItem]
  );

  const paletteItems = useMemo(
    () => paletteOrder.map((id) => findItem(id)!).filter(Boolean),
    [paletteOrder, findItem]
  );

  // Estimate toolbar width: left grip(20+4sep+4) + items + trailing gap area + sep + more btn + sep + right grip
  const toolbarWidth = useMemo(() => {
    const leftHandle = 20 + 4 + 4; // grip + mx + separator
    const items = pinnedItems.length * (32 + 6); // item width + gap (insert gap 6)
    const rightSection = 4 + 32 + 4 + 4 + 20; // sep + more + mx + sep + grip
    const padding = 12; // px-1.5 * 2
    return leftHandle + items + rightSection + padding;
  }, [pinnedItems.length]);

  // Palette matches toolbar width; compute item size from that
  const paletteWidth = toolbarWidth + TRIGGER_SIZE + 8; // trigger + gap + toolbar
  const PALETTE_ITEM_SIZE = useMemo(
    () => Math.floor((paletteWidth - PALETTE_PAD * 2 - (PALETTE_COLS - 1) * PALETTE_GAP) / PALETTE_COLS),
    [paletteWidth]
  );
  const paletteIconSize = Math.max(12, Math.round(PALETTE_ITEM_SIZE * 0.38));
  const paletteFontSize = Math.max(7, Math.round(PALETTE_ITEM_SIZE * 0.22));

  const TOOLBAR_HEIGHT = 44; // approximate toolbar outer height

  // --- Drag to reposition ---
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...pos };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    const maxX = window.innerWidth - TRIGGER_SIZE;
    const maxY = window.innerHeight - TRIGGER_SIZE;
    setPos({
      x: Math.max(0, Math.min(maxX, posStart.current.x + dx)),
      y: Math.max(0, Math.min(maxY, posStart.current.y + dy)),
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isDragging.current = false;
    // Reset hasMoved after a tick so the current click cycle can still check it,
    // but future clicks won't be blocked by a previous drag.
    requestAnimationFrame(() => {
      hasMoved.current = false;
    });
  }, []);

  // Close on outside click (but not during drag operations)
  const isDraggingRef = useRef(false);
  useEffect(() => {
    const onDragStart = () => { isDraggingRef.current = true; };
    const onDragEnd = () => { setTimeout(() => { isDraggingRef.current = false; }, 200); };
    const handler = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      // Don't close if the click is on a draggable element (e.g. dock items)
      const target = e.target as HTMLElement;
      if (target.closest?.('[draggable="true"]')) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setMenuOpen(false);
        setPaletteOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("dragend", onDragEnd);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("dragend", onDragEnd);
    };
  }, []);

  // Compute directions based on position
  

  const computeDirections = useCallback(() => {
    const spaceBelow = window.innerHeight - (pos.y + TRIGGER_SIZE);
    const toolbarFitsBelow = spaceBelow > TOOLBAR_HEIGHT + 16;
    const newToolbarAbove = !toolbarFitsBelow;

    const paletteHeight = Math.ceil(paletteItems.length / PALETTE_COLS) * (PALETTE_ITEM_SIZE + PALETTE_GAP) + PALETTE_PAD * 2;
    const totalBelow = TOOLBAR_HEIGHT + 8 + paletteHeight + 16;
    const newPaletteAbove = newToolbarAbove || spaceBelow < totalBelow;

    // Horizontal: check if toolbar fits to the right
    const spaceRight = window.innerWidth - pos.x;
    const maxWidth = Math.max(toolbarWidth, paletteWidth);
    const newOpenLeft = spaceRight < maxWidth + 16;

    return { toolbarAbove: newToolbarAbove, paletteAbove: newPaletteAbove, openLeft: newOpenLeft };
  }, [paletteItems.length, pos.y, pos.x, toolbarWidth, paletteWidth]);

  useEffect(() => {
    const dirs = computeDirections();
    setToolbarAbove(dirs.toolbarAbove);
    setPaletteAbove(dirs.paletteAbove);
    setOpenLeft(dirs.openLeft);
  }, [computeDirections]);

  const handleTriggerClick = () => {
    if (hasMoved.current) return;
    if (menuOpen) {
      setMenuOpen(false);
      setPaletteOpen(false);
    } else {
      const dirs = computeDirections();
      setToolbarAbove(dirs.toolbarAbove);
      setPaletteAbove(dirs.paletteAbove);
      setOpenLeft(dirs.openLeft);
      setMenuOpen(true);
    }
  };

  const handlePaletteToggle = () => {
    if (hasMoved.current) return;
    setPaletteOpen((v) => !v);
  };

  const handleItemClick = (id: string) => {
    if (hasMoved.current) return;
    setActiveItem(id);
  };

  // --- Item DnD ---
  const onItemDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = "move";
    const item = allItems.find((i) => i.id === id);
    if (item) {
      const data = encodeDragData({ id: item.id, label: item.label, iconName: item.iconName, source: "menu" });
      e.dataTransfer.setData(DRAG_MIME, data);
      e.dataTransfer.setData("text/plain", data);
    }
  };

  const onItemDragEnd = () => {
    setDraggedItemId(null);
    setDropTargetIndex(null);
    setDropMode("insert");
    setDropOnPalette(false);
    setPaletteDropIndex(null);
    setPaletteDropMode("insert");
  };

  const onItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetIndex(index);
    setDropMode("replace");
    setDropOnPalette(false);
  };

  const onGapDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetIndex(index);
    setDropMode("insert");
    setDropOnPalette(false);
  };

  const onPinnedDrop = (e: React.DragEvent, index: number, mode: "replace" | "insert") => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItemId) return;

    const wasPinned = pinnedIds.includes(draggedItemId);

    setPinnedIds((prev) => {
      if (mode === "replace") {
        if (wasPinned) {
          const dragIdx = prev.indexOf(draggedItemId);
          const newList = [...prev];
          newList[dragIdx] = prev[index];
          newList[index] = draggedItemId;
          return newList;
        } else {
          const displacedId = prev[index];
          const newList = [...prev];
          newList[index] = draggedItemId;
          // Add displaced item to palette, remove dragged from palette
          setPaletteOrder((po) => {
            const without = po.filter((id) => id !== draggedItemId);
            return [...without, displacedId];
          });
          return newList;
        }
      } else {
        if (wasPinned) {
          const without = prev.filter((id) => id !== draggedItemId);
          const newList = [...without];
          newList.splice(index, 0, draggedItemId);
          return newList;
        } else {
          const newList = [...prev];
          newList.splice(index, 0, draggedItemId);
          // Remove from palette
          setPaletteOrder((po) => po.filter((id) => id !== draggedItemId));
          if (newList.length > MAX_PINNED) {
            const overflow = newList.pop()!;
            setPaletteOrder((po) => [...po, overflow]);
          }
          return newList;
        }
      }
    });
    onItemDragEnd();
  };

  const onPaletteDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropOnPalette(true);
    setDropTargetIndex(null);
  };

  const onPaletteItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Detect left edge → insert, otherwise replace
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    if (offsetX < PALETTE_ITEM_SIZE * 0.3) {
      setPaletteDropIndex(index);
      setPaletteDropMode("insert");
    } else {
      setPaletteDropIndex(index);
      setPaletteDropMode("replace");
    }
    setDropOnPalette(true);
    setDropTargetIndex(null);
  };

  const onPaletteGapDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setPaletteDropIndex(index);
    setPaletteDropMode("insert");
    setDropOnPalette(true);
    setDropTargetIndex(null);
  };

  const onPaletteDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check for cross-component drop from dock
    const externalData = decodeDragData(e);
    if (externalData && externalData.source === "dock" && !draggedItemId) {
      const menuId = ensureItem(externalData);
      if (!menuId) { onItemDragEnd(); return; }
      if (pinnedIds.includes(menuId) || paletteOrder.includes(menuId)) { onItemDragEnd(); return; }
      const dropIdx = paletteDropIndex ?? paletteOrder.length;
      setPaletteOrder((po) => {
        const newPo = [...po];
        newPo.splice(dropIdx, 0, menuId);
        return newPo;
      });
      onItemDragEnd();
      return;
    }

    if (!draggedItemId) return;

    const dropIdx = paletteDropIndex ?? paletteOrder.length;
    const fromToolbar = pinnedIds.includes(draggedItemId);

    if (!fromToolbar) { onItemDragEnd(); return; }

    if (paletteDropIndex !== null && paletteDropMode === "replace") {
      const targetPaletteItemId = paletteOrder[paletteDropIndex];
      if (targetPaletteItemId) {
        const newPinned = [...pinnedIds];
        const dragIdx = newPinned.indexOf(draggedItemId);
        newPinned[dragIdx] = targetPaletteItemId;

        const newPalette = [...paletteOrder];
        newPalette[paletteDropIndex] = draggedItemId;

        setPinnedIds(newPinned);
        setPaletteOrder(newPalette.filter((id) => !newPinned.includes(id)));
      }
    } else {
      const newPinned = pinnedIds.filter((id) => id !== draggedItemId);
      const newPalette = [...paletteOrder];
      newPalette.splice(dropIdx, 0, draggedItemId);

      while (newPinned.length < MAX_PINNED && newPalette.length > 0) {
        const idx = newPalette.findIndex((id) => !newPinned.includes(id) && id !== draggedItemId);
        if (idx === -1) break;
        newPinned.push(newPalette.splice(idx, 1)[0]);
      }

      setPinnedIds(newPinned);
      setPaletteOrder(newPalette.filter((id) => !newPinned.includes(id)));
    }
    onItemDragEnd();
  };

  const onToolbarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetIndex(pinnedIds.length);
    setDropOnPalette(false);
  };

  // Helper: ensure an external item (from dock) is registered
  const ensureItem = useCallback((data: { id: string; label: string; iconName: string }): string | null => {
    const icon = getIcon(data.iconName);
    if (!icon) return null;
    // Use the dock id without prefix for menu
    const menuId = data.id.replace(/^dock-/, "");
    if (!findItem(menuId)) {
      setExtraItems((prev) => {
        if (prev.some((i) => i.id === menuId)) return prev;
        return [...prev, { id: menuId, icon, label: data.label, iconName: data.iconName }];
      });
    }
    return menuId;
  }, [findItem]);

  const onToolbarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // Check for cross-component drop from dock
    const externalData = decodeDragData(e);
    if (externalData && externalData.source === "dock") {
      const menuId = ensureItem(externalData);
      if (!menuId) { onItemDragEnd(); return; }
      if (pinnedIds.includes(menuId) || paletteOrder.includes(menuId)) { onItemDragEnd(); return; }
      const newList = [...pinnedIds, menuId];
      if (newList.length > MAX_PINNED) {
        const overflow = newList.pop()!;
        setPaletteOrder((po) => [...po, overflow]);
      }
      setPinnedIds(newList);
      onItemDragEnd();
      return;
    }
    if (!draggedItemId) return;
    if (pinnedIds.includes(draggedItemId)) { onItemDragEnd(); return; }
    const newList = [...pinnedIds, draggedItemId];
    setPaletteOrder((po) => po.filter((id) => id !== draggedItemId));
    if (newList.length > MAX_PINNED) {
      const overflow = newList.pop()!;
      setPaletteOrder((po) => [...po, overflow]);
    }
    setPinnedIds(newList);
    onItemDragEnd();
  };

  // Determine if the dragged item is from toolbar (for push-back visual)
  const isDragFromToolbar = draggedItemId !== null && pinnedIds.includes(draggedItemId);
  const isDragFromPalette = draggedItemId !== null && !pinnedIds.includes(draggedItemId);

  const isDragActive = draggedItemId !== null;

  return (
    <div
      ref={containerRef}
      className="fixed z-50 select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Trigger — drag handle */}
      <motion.button
        className="relative z-20 flex h-11 w-11 items-center justify-center rounded-[14px] border border-menu-glass-border bg-menu-glass/80 text-muted-foreground backdrop-blur-2xl shadow-lg shadow-black/20 cursor-grab active:cursor-grabbing transition-colors hover:text-foreground"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleTriggerClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <AnimatePresence mode="wait">
          {menuOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-[18px] w-[18px]" />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Menu className="h-[18px] w-[18px]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Toolbar — horizontal pill */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={`absolute z-10 flex items-center gap-0.5 rounded-2xl border border-menu-glass-border bg-menu-glass/80 px-1.5 py-1.5 backdrop-blur-2xl shadow-xl shadow-black/25 transition-colors top-0 ${
              isDragActive && !dropOnPalette ? "border-primary/40" : ""
            }`}
            style={{ left: TRIGGER_SIZE + 8, width: 460 }}
            initial={{ opacity: 0, y: toolbarAbove ? 8 : -8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: toolbarAbove ? 8 : -8, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            onDragOver={onToolbarDragOver}
            onDrop={onToolbarDrop}
          >
            {/* Drag handle — repositions the whole menu */}
            <div
              className="flex h-8 w-5 items-center justify-center text-muted-foreground/40 cursor-grab active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>

            <div className="mx-0.5 h-5 w-px bg-menu-separator/40" />

            {pinnedItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              const isBeingDragged = draggedItemId === item.id;
              const isInsertTarget = dropTargetIndex === i && dropMode === "insert" && isDragActive;
              const isReplaceTarget = dropTargetIndex === i && dropMode === "replace" && isDragActive;
              const isHovered = hoveredItem === item.id;
              // When dragging from toolbar to palette, shrink the dragged item's slot
              const shouldCollapse = isBeingDragged && dropOnPalette;

              return (
                <motion.div
                  key={item.id}
                  className="flex items-center"
                  layout="size"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {/* Animated insert gap */}
                  <motion.div
                    className="flex items-center justify-center overflow-hidden"
                    style={{ height: 32 }}
                    animate={{
                      width: isInsertTarget ? ITEM_SLOT_SIZE : 6,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    onDragOver={(e) => onGapDragOver(e as unknown as React.DragEvent, i)}
                    onDrop={(e) => onPinnedDrop(e as unknown as React.DragEvent, i, "insert")}
                  >
                    <motion.div
                      className="rounded-full bg-primary"
                      animate={{
                        width: isInsertTarget ? 3 : 0,
                        height: isInsertTarget ? 20 : 0,
                        opacity: isInsertTarget ? 1 : 0,
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.div>

                  {/* Toolbar item with collapsible wrapper */}
                  <div
                    className="tooltip"
                    data-tooltip={isDragActive ? "" : item.label}
                    data-tooltip-placement="top"
                  >
                    <motion.div
                      animate={{
                        width: shouldCollapse ? 0 : 32,
                        opacity: shouldCollapse ? 0 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <motion.button
                        draggable
                        onDragStart={(e) => onItemDragStart(e as unknown as React.DragEvent, item.id)}
                        onDragEnd={onItemDragEnd}
                        onDragOver={(e) => onItemDragOver(e as unknown as React.DragEvent, i)}
                        onDrop={(e) => onPinnedDrop(e as unknown as React.DragEvent, i, "replace")}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`group relative flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors duration-150 cursor-grab active:cursor-grabbing ${
                          isBeingDragged && !shouldCollapse ? "opacity-30" : ""
                        } ${
                          isReplaceTarget
                            ? "ring-2 ring-primary/60 bg-primary/15"
                            : isActive
                              ? "bg-menu-active-bg text-foreground"
                              : "text-muted-foreground hover:bg-menu-glass-hover hover:text-foreground"
                        }`}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <Icon className="pointer-events-none h-[16px] w-[16px]" />
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}

            {/* Trailing insert gap — animated */}
            {isDragActive && isDragFromPalette && (
              <motion.div
                className="flex items-center justify-center overflow-hidden"
                style={{ height: 32 }}
                animate={{
                  width: dropTargetIndex === pinnedIds.length && dropMode === "insert" ? ITEM_SLOT_SIZE : 6,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                onDragOver={(e) => onGapDragOver(e as unknown as React.DragEvent, pinnedIds.length)}
                onDrop={(e) => onPinnedDrop(e as unknown as React.DragEvent, pinnedIds.length, "insert")}
              >
                <motion.div
                  className="rounded-full bg-primary"
                  animate={{
                    width: dropTargetIndex === pinnedIds.length && dropMode === "insert" ? 3 : 0,
                    height: dropTargetIndex === pinnedIds.length && dropMode === "insert" ? 20 : 0,
                    opacity: dropTargetIndex === pinnedIds.length && dropMode === "insert" ? 1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.div>
            )}

            <div className="mx-0.5 h-5 w-px bg-menu-separator/40" />

            {/* More button */}
            <motion.button
              className={`relative flex h-8 w-8 items-center justify-center rounded-[10px] transition-all duration-150 ${
                paletteOpen
                  ? "bg-menu-active-bg text-foreground"
                  : "text-muted-foreground hover:bg-menu-glass-hover hover:text-foreground"
              }`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handlePaletteToggle}
            >
              <MoreHorizontal className="h-[16px] w-[16px]" />
            </motion.button>

            <div className="mx-0.5 h-5 w-px bg-menu-separator/40" />

            {/* Right drag handle — repositions the whole menu */}
            <div
              className="flex h-8 w-5 items-center justify-center text-muted-foreground/40 cursor-grab active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Palette — grid popover */}
      <AnimatePresence>
        {paletteOpen && menuOpen && (
          <motion.div
            className={`absolute z-10 rounded-2xl border border-menu-glass-border bg-menu-glass/80 p-3 backdrop-blur-2xl shadow-xl shadow-black/25 max-h-[60vh] overflow-y-auto overflow-x-hidden transition-colors ${
              isDragActive && dropOnPalette ? "border-primary/40" : ""
            }`}
            style={{
              top: TOOLBAR_HEIGHT + 8,
              left: TRIGGER_SIZE + 8,
              width: paletteWidth,
            }}
            initial={{ opacity: 0, y: toolbarAbove ? 12 : -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: toolbarAbove ? 12 : -12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            onDragOver={onPaletteDragOver}
            onDrop={onPaletteDrop}
          >
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              All Actions
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${PALETTE_COLS}, 1fr)`,
                gap: PALETTE_GAP,
              }}
            >
              {paletteItems.length === 0 && (
                <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
                  All items pinned
                </div>
              )}
              {(() => {
                // Build the render list: items with an optional insertion placeholder
                const insertIdx = paletteDropIndex !== null && paletteDropMode === "insert" && isDragActive && isDragFromToolbar ? paletteDropIndex : -1;
                const renderItems: Array<{ type: "item"; item: MenuItem; origIndex: number } | { type: "placeholder"; index: number }> = [];

                paletteItems.forEach((item, i) => {
                  if (insertIdx === i) {
                    renderItems.push({ type: "placeholder", index: i });
                  }
                  renderItems.push({ type: "item", item, origIndex: i });
                });
                // Handle insert at end
                if (insertIdx === paletteItems.length) {
                  renderItems.push({ type: "placeholder", index: paletteItems.length });
                }

                return renderItems.map((entry) => {
                  if (entry.type === "placeholder") {
                    return (
                      <motion.div
                        key="insert-placeholder"
                        className="flex items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-primary/10 aspect-square"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        onDragOver={(e) => onPaletteGapDragOver(e as unknown as React.DragEvent, entry.index)}
                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onPaletteDrop(e as unknown as React.DragEvent); }}
                      >
                        <div className="w-0.5 h-6 rounded-full bg-primary" />
                      </motion.div>
                    );
                  }

                  const { item, origIndex: i } = entry;
                  const Icon = item.icon;
                  const isBeingDragged = draggedItemId === item.id;
                  const isHovered = hoveredItem === item.id;
                  const isReplaceTarget = paletteDropIndex === i && paletteDropMode === "replace" && isDragActive && isDragFromToolbar;

                  return (
                    <motion.button
                      key={item.id}
                      draggable
                      onDragStart={(e) => onItemDragStart(e as unknown as React.DragEvent, item.id)}
                      onDragEnd={onItemDragEnd}
                      onDragOver={(e) => onPaletteItemDragOver(e as unknown as React.DragEvent, i)}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onPaletteDrop(e as unknown as React.DragEvent); }}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      data-tooltip={isDragActive ? "" : item.label}
                      data-tooltip-placement="top"
                      className={`tooltip group relative flex flex-col items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-menu-glass-hover hover:text-foreground cursor-grab active:cursor-grabbing aspect-square ${
                        isBeingDragged ? "opacity-20" : ""
                      } ${
                        isReplaceTarget ? "ring-2 ring-primary/60 bg-primary/15" : ""
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: isBeingDragged ? 0.2 : 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      onClick={() => handleItemClick(item.id)}
                    >
                      <Icon className="pointer-events-none" style={{ width: paletteIconSize, height: paletteIconSize }} />
                      <span className="pointer-events-none mt-0.5 font-medium leading-tight opacity-60 truncate" style={{ fontSize: paletteFontSize, maxWidth: PALETTE_ITEM_SIZE - 4 }}>
                        {item.label}
                      </span>
                    </motion.button>
                  );
                });
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingMenu;
