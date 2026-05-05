import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Settings, Accessibility, LayoutDashboard, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Section = "general" | "accessibility" | "dock";

interface DockSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animationsEnabled: boolean;
  onAnimationsChange: (enabled: boolean) => void;
}

const sections: { id: Section; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "dock", label: "Dock", icon: LayoutDashboard },
];

const GeneralSettings = ({
  animationsEnabled,
  onAnimationsChange,
}: {
  animationsEnabled: boolean;
  onAnimationsChange: (v: boolean) => void;
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Appearance</h3>
      <p className="text-xs text-muted-foreground mb-3">Customize the look and feel</p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="animations" className="text-sm">Enable animations</Label>
          <Switch
            id="animations"
            checked={animationsEnabled}
            onCheckedChange={onAnimationsChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="transparency" className="text-sm">Reduce transparency</Label>
          <Switch id="transparency" />
        </div>
      </div>
    </div>
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Notifications</h3>
      <p className="text-xs text-muted-foreground mb-3">Manage notification preferences</p>
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications" className="text-sm">Show badge counts</Label>
        <Switch id="notifications" defaultChecked />
      </div>
    </div>
  </div>
);

const AccessibilitySettings = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Display</h3>
      <p className="text-xs text-muted-foreground mb-3">Adjust display settings for better visibility</p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="high-contrast" className="text-sm">Increase contrast</Label>
          <Switch id="high-contrast" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="reduce-motion" className="text-sm">Reduce motion</Label>
          <Switch id="reduce-motion" />
        </div>
      </div>
    </div>
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Text Size</h3>
      <p className="text-xs text-muted-foreground mb-3">Adjust the size of text</p>
      <Slider defaultValue={[14]} min={10} max={24} step={1} className="w-full" />
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>Small</span>
        <span>Large</span>
      </div>
    </div>
  </div>
);

const DockSettingsContent = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Size</h3>
      <p className="text-xs text-muted-foreground mb-3">Adjust the size of dock icons</p>
      <Slider defaultValue={[48]} min={32} max={80} step={4} className="w-full" />
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>Small</span>
        <span>Large</span>
      </div>
    </div>
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Magnification</h3>
      <p className="text-xs text-muted-foreground mb-3">Icon magnification on hover</p>
      <div className="flex items-center justify-between mb-3">
        <Label htmlFor="magnification" className="text-sm">Enable magnification</Label>
        <Switch id="magnification" defaultChecked />
      </div>
      <Slider defaultValue={[80]} min={48} max={128} step={4} className="w-full" />
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>Min</span>
        <span>Max</span>
      </div>
    </div>
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Position</h3>
      <p className="text-xs text-muted-foreground mb-3">Position of the dock on screen</p>
      <div className="flex items-center justify-between">
        <Label htmlFor="autohide" className="text-sm">Automatically hide dock</Label>
        <Switch id="autohide" />
      </div>
    </div>
  </div>
);

const DockSettings = ({ open, onOpenChange, animationsEnabled, onAnimationsChange }: DockSettingsProps) => {
  const [activeSection, setActiveSection] = useState<Section>("general");
  const panelRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [panelPos, setPanelPos] = useState({ x: window.innerWidth / 2 - 280, y: window.innerHeight / 2 - 200 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const onHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: panelPos.x,
      origY: panelPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [panelPos]);

  const onHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPanelPos({
      x: Math.max(0, Math.min(window.innerWidth - 560, dragState.current.origX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 400, dragState.current.origY + dy)),
    });
  }, []);

  const onHeaderPointerUp = useCallback((e: React.PointerEvent) => {
    dragState.current.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onOpenChange]);

  // Reset position when opened
  useEffect(() => {
    if (open) {
      setPanelPos({ x: window.innerWidth / 2 - 280, y: window.innerHeight / 2 - 200 });
    }
  }, [open]);

  const renderContent = () => {
    switch (activeSection) {
      case "general": return (
        <GeneralSettings
          animationsEnabled={animationsEnabled}
          onAnimationsChange={onAnimationsChange}
        />
      );
      case "accessibility": return <AccessibilitySettings />;
      case "dock": return <DockSettingsContent />;
    }
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="fixed w-[560px] rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden z-[100]"
      style={{
        left: panelPos.x,
        top: panelPos.y,
        animation: "scale-in 0.2s ease-out",
      }}
    >
      {/* Draggable header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border cursor-grab active:cursor-grabbing select-none bg-muted/50"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
      >
        <h2 className="text-sm font-semibold text-foreground">Settings</h2>
        <button
          onClick={() => onOpenChange(false)}
          className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-[340px]">
        {/* Left sidebar */}
        <div className="w-44 border-r border-border bg-muted/30 p-4 flex flex-col gap-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <div className="flex-1 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {activeSection}
            </h2>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DockSettings;
