"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

export type KanbanItem = {
  id: string;
  stage: string;
  [key: string]: unknown;
};

type KanbanBoardProps<T extends KanbanItem> = {
  columns: readonly string[];
  items: T[];
  onStageChange: (id: string, stage: string) => void;
  renderCardContent: (item: T) => React.ReactNode;
  onCardClick: (item: T) => void;
  isOverdue: (item: T) => boolean;
};

export function KanbanBoard<T extends KanbanItem>({
  columns,
  items,
  onStageChange,
  renderCardContent,
  onCardClick,
  isOverdue,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeItem = items.find((i) => i.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const itemId = active.id as string;
    const newStage = over.id as string;
    const item = items.find((i) => i.id === itemId);
    if (item && item.stage !== newStage && columns.includes(newStage)) {
      onStageChange(itemId, newStage);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnItems = items.filter((i) => i.stage === column);
          return (
            <KanbanColumn key={column} id={column} title={column} count={columnItems.length}>
              {columnItems.map((item) => (
                <KanbanCard
                  key={item.id}
                  id={item.id}
                  overdue={isOverdue(item)}
                  onClick={() => onCardClick(item)}
                >
                  {renderCardContent(item)}
                </KanbanCard>
              ))}
            </KanbanColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="kanban-card opacity-90 shadow-xl">
            {renderCardContent(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
