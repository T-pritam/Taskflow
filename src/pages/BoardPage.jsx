import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { KanbanSquare, List, Plus } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useLabels } from "@/hooks/useLabels";
import { useMembers } from "@/hooks/useMembers";
import { byPriority } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import ListView from "@/components/tasks/ListView";
import TaskModal from "@/components/tasks/TaskModal";

const ALL = "all";

export default function BoardPage() {
  const { sections } = useOutletContext();
  const { tasks, loading, createTask, updateTask, updateStatus, deleteTask } = useTasks();
  const { labels, createLabel } = useLabels();
  const { members } = useMembers();

  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFilter = searchParams.get("section") ?? ALL;
  const assigneeFilter = searchParams.get("assignee") ?? ALL;

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === ALL) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  const taskParam = searchParams.get("task");
  useEffect(() => {
    if (!taskParam) return;
    const target = tasks.find((t) => t.id === taskParam);
    if (target) {
      setActiveTask(target);
      setModalOpen(true);
    }
  }, [taskParam, tasks]);

  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          if (sectionFilter !== ALL && task.section_id !== sectionFilter) return false;
          if (assigneeFilter !== ALL && task.assignee_id !== assigneeFilter) return false;
          return true;
        })
        .sort(byPriority),
    [tasks, sectionFilter, assigneeFilter]
  );

  function openNewTask() {
    setActiveTask(null);
    setModalOpen(true);
  }

  function openTask(task) {
    setActiveTask(task);
    setModalOpen(true);
    setFilter("task", task.id);
  }

  function handleModalOpenChange(open) {
    setModalOpen(open);
    if (!open) {
      setActiveTask(null);
      setFilter("task", ALL);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Board</h1>
        <Button onClick={openNewTask}>
          <Plus className="size-4" />
          New task
        </Button>
      </div>

      <Tabs defaultValue="kanban" className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="kanban">
              <KanbanSquare className="size-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="size-4" />
              List
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2">
            <Select value={sectionFilter} onValueChange={(v) => setFilter("section", v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={(v) => setFilter("assignee", v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All assignees</SelectItem>
                {members
                  .filter((m) => m.role)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name || m.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground py-12 text-center text-sm">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <EmptyBoard onCreate={openNewTask} />
        ) : visibleTasks.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No tasks match these filters.
          </p>
        ) : (
          <>
            <TabsContent value="kanban">
              <KanbanBoard
                tasks={visibleTasks}
                onStatusChange={updateStatus}
                onOpenTask={openTask}
              />
            </TabsContent>
            <TabsContent value="list">
              <ListView tasks={visibleTasks} sections={sections} onOpenTask={openTask} />
            </TabsContent>
          </>
        )}
      </Tabs>

      <TaskModal
        key={activeTask?.id ?? "new"}
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        task={activeTask}
        sections={sections}
        labels={labels}
        members={members}
        onCreateLabel={createLabel}
        createTask={createTask}
        updateTask={updateTask}
        deleteTask={deleteTask}
      />
    </div>
  );
}

function EmptyBoard({ onCreate }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <KanbanSquare className="text-muted-foreground size-8" />
      <div>
        <p className="font-medium">No tasks yet</p>
        <p className="text-muted-foreground text-sm">Create your first task to get going.</p>
      </div>
      <Button onClick={onCreate} variant="outline">
        <Plus className="size-4" />
        New task
      </Button>
    </div>
  );
}
