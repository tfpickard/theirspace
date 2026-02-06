"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function SortableItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2 p-3 text-sm font-semibold">{label}</Card>
    </div>
  );
}

export function Top8Editor({
  initial,
  onSaved
}: {
  initial: { id: string; label: string }[];
  onSaved?: () => void;
}) {
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const sensors = useSensors(useSensor(PointerSensor));

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/top8", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentIds: items.map((item) => item.id) })
      });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            setItems((prev) => arrayMove(prev, oldIndex, newIndex));
          }
        }}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} label={item.label} />
          ))}
        </SortableContext>
      </DndContext>
      <Button onClick={save} disabled={saving} className="mt-3">
        {saving ? "Saving..." : "Save order"}
      </Button>
    </div>
  );
}
