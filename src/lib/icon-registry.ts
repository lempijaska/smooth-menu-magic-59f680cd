import {
  Home, Search, Bell, Heart, User, Settings, Mail, Bookmark,
  Share2, Camera, Zap, Globe, Music, Video, Image, FileText,
  Folder, Archive, Cloud, Lock, Unlock, Star, Sun, Moon,
  Coffee, Gift, Award, Target, Flag, Map, Compass, Wifi, Battery,
  Monitor, Smartphone, Tablet, Watch, Headphones, Mic, Volume2,
  Download, Upload, Printer, Trash2, Edit, Eye, MessageSquare,
  Calendar, Clock, Calculator, BookOpen, StickyNote,
  type LucideIcon,
} from "lucide-react";

export interface DragItemData {
  id: string;
  label: string;
  iconName: string;
  source: "menu" | "dock";
}

const iconMap: Record<string, LucideIcon> = {
  Home, Search, Bell, Heart, User, Settings, Mail, Bookmark,
  Share2, Camera, Zap, Globe, Music, Video, Image, FileText,
  Folder, Archive, Cloud, Lock, Unlock, Star, Sun, Moon,
  Coffee, Gift, Award, Target, Flag, Map, Compass, Wifi, Battery,
  Monitor, Smartphone, Tablet, Watch, Headphones, Mic, Volume2,
  Download, Upload, Printer, Trash2, Edit, Eye, MessageSquare,
  Calendar, Clock, Calculator, BookOpen, StickyNote,
};

export const getIcon = (name: string): LucideIcon | undefined => iconMap[name];

export const DRAG_MIME = "application/x-lovable-drag";

export const encodeDragData = (data: DragItemData): string => JSON.stringify(data);

export const decodeDragData = (e: React.DragEvent): DragItemData | null => {
  try {
    const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.id && parsed.source) return parsed as DragItemData;
    return null;
  } catch {
    return null;
  }
};
