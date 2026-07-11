import { useState } from "react";
import { Check, Plus, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function LabelSelect({ labels, value, onChange, onCreate, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = labels.filter((l) => value.includes(l.id));
  const trimmed = query.trim();
  const matches = labels.filter((l) =>
    l.name.toLowerCase().includes(trimmed.toLowerCase())
  );
  const exactExists = labels.some((l) => l.name.toLowerCase() === trimmed.toLowerCase());

  function toggle(labelId) {
    if (value.includes(labelId)) {
      onChange(value.filter((id) => id !== labelId));
    } else {
      onChange([...value, labelId]);
    }
  }

  async function handleCreate() {
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const label = await onCreate(trimmed);
      onChange([...value, label.id]);
      setQuery("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start font-normal"
            disabled={disabled}
          >
            <Tag className="size-4" />
            {selected.length > 0 ? `${selected.length} selected` : "Add labels"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <div className="border-b p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or create…"
              className="h-8"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto p-1">
            {matches.map((label) => (
              <li key={label.id}>
                <button
                  type="button"
                  onClick={() => toggle(label.id)}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
                >
                  <Check
                    className={
                      value.includes(label.id) ? "size-4 opacity-100" : "size-4 opacity-0"
                    }
                  />
                  {label.name}
                </button>
              </li>
            ))}

            {trimmed && !exactExists && (
              <li>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
                >
                  <Plus className="size-4" />
                  Create &quot;{trimmed}&quot;
                </button>
              </li>
            )}

            {matches.length === 0 && !trimmed && (
              <li className="text-muted-foreground px-2 py-4 text-center text-sm">
                No labels yet. Type to create one.
              </li>
            )}
          </ul>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((label) => (
            <Badge key={label.id} variant="secondary" className="gap-1">
              {label.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggle(label.id)}
                  className="hover:text-foreground"
                  aria-label={`Remove ${label.name}`}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
