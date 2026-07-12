import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { KanbanSquare, Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SidebarNav({ sections, createSection, onNavigate }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeSection = searchParams.get("section");
  const onBoard = location.pathname === "/";

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddSection(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await createSection(trimmed);
      toast.success(`Section "${trimmed}" added`);
      setName("");
      setAdding(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <nav className="flex h-full flex-col gap-6 p-4">
      <div className="flex flex-col gap-1">
        <NavLink to="/" active={onBoard && !activeSection} onNavigate={onNavigate}>
          <KanbanSquare className="size-4" />
          Board
        </NavLink>
        <NavLink to="/team" active={location.pathname === "/team"} onNavigate={onNavigate}>
          <Users className="size-4" />
          Team
        </NavLink>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between px-2">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Sections
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setAdding((v) => !v)}
            aria-label="Add section"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {adding && (
          <form onSubmit={handleAddSection} className="flex gap-1 px-2 py-1">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Section name"
              className="h-8"
            />
            <Button type="submit" size="icon" className="size-8 shrink-0" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            </Button>
          </form>
        )}

        {sections.length === 0 && !adding ? (
          <p className="text-muted-foreground px-2 py-1 text-sm">No sections yet.</p>
        ) : (
          sections.map((section) => (
            <NavLink
              key={section.id}
              to={`/?section=${section.id}`}
              active={onBoard && activeSection === section.id}
              onNavigate={onNavigate}
            >
              <span className="bg-muted-foreground/40 size-1.5 rounded-full" />
              <span className="truncate">{section.name}</span>
            </NavLink>
          ))
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, active, onNavigate, children }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active && "bg-accent font-medium"
      )}
    >
      {children}
    </Link>
  );
}
