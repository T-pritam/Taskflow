import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { STATUS_LABELS, STATUSES } from "@/lib/constants";
import TaskCard from "./TaskCard";

export default function KanbanBoard({ tasks, onStatusChange, onOpenTask }) {
  async function handleDragEnd(result) {
    const { draggableId, source, destination } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    try {
      await onStatusChange(draggableId, destination.droppableId);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);

          return (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-muted/40 flex w-72 shrink-0 flex-col rounded-lg border p-3 transition-colors ${
                    snapshot.isDraggingOver ? "bg-muted" : ""
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-medium">{STATUS_LABELS[status]}</h2>
                    <span className="text-muted-foreground text-xs">{columnTasks.length}</span>
                  </div>

                  <div className="flex min-h-16 flex-col gap-2">
                    {columnTasks.map((task, index) => (
                      <Draggable draggableId={task.id} index={index} key={task.id}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              dragging={dragSnapshot.isDragging}
                              onClick={() => onOpenTask(task)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-muted-foreground py-4 text-center text-xs">
                        Nothing here
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
