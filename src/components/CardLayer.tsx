import { useState, useRef } from "react";
import { Trash2, GripHorizontal } from "lucide-react";
import { decodeDragData } from "@/lib/icon-registry";

interface CardData {
  id: string;
  x: number;
  y: number;
}

const CARD_W = 220;
const CARD_H = 140;

const CardLayer = () => {
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragState = useRef<{ id: string; offX: number; offY: number; moved: boolean } | null>(null);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const data = decodeDragData(e);
    if (!data || data.id !== "card") return;
    const id = `card-${Date.now()}`;
    const x = Math.max(8, Math.min(window.innerWidth - CARD_W - 8, e.clientX - CARD_W / 2));
    const y = Math.max(8, Math.min(window.innerHeight - CARD_H - 8, e.clientY - CARD_H / 2));
    setCards((prev) => [...prev, { id, x, y }]);
    setSelectedId(id);
  };

  const onCardPointerDown = (e: React.PointerEvent, card: CardData) => {
    e.stopPropagation();
    setSelectedId(card.id);
    dragState.current = {
      id: card.id,
      offX: e.clientX - card.x,
      offY: e.clientY - card.y,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onCardPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const { id, offX, offY } = dragState.current;
    dragState.current.moved = true;
    setCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, x: e.clientX - offX, y: e.clientY - offY } : c
      )
    );
  };
  const onCardPointerUp = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    dragState.current = null;
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div
      className={`absolute inset-0 z-30 transition-colors ${
        dragOver ? "bg-primary/5 ring-2 ring-primary/30 ring-inset" : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => setSelectedId(null)}
    >
      {cards.map((card) => {
        const isSelected = selectedId === card.id;
        return (
          <div
            key={card.id}
            className="absolute"
            style={{ left: card.x, top: card.y, width: CARD_W }}
            onClick={(e) => e.stopPropagation()}
          >
            {isSelected && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-xl border border-menu-glass-border bg-menu-glass/90 px-1.5 py-1 backdrop-blur-2xl shadow-lg shadow-black/20 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => deleteCard(card.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                  aria-label="Delete card"
                  title="Delete card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <div
              onPointerDown={(e) => onCardPointerDown(e, card)}
              onPointerMove={onCardPointerMove}
              onPointerUp={onCardPointerUp}
              onPointerCancel={onCardPointerUp}
              className={`rounded-2xl border bg-card text-card-foreground p-4 shadow-lg cursor-grab active:cursor-grabbing transition-shadow ${
                isSelected
                  ? "ring-2 ring-primary shadow-xl border-primary/50"
                  : "border-border hover:shadow-xl"
              }`}
              style={{ height: CARD_H }}
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <GripHorizontal className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Card
                </span>
              </div>
              <p className="text-sm text-foreground/80">
                Click to select. Drag to move.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardLayer;
