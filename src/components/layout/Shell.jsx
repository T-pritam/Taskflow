import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/store/authStore";
import { useSections } from "@/hooks/useSections";
import { initialsOf } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import SidebarNav from "./SidebarNav";

export default function Shell() {
  const { profile, role, signOut } = useAuth();
  const { sections, createSection } = useSections();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Board sections and pages</SheetDescription>
            </SheetHeader>
            <SidebarNav
              sections={sections}
              createSection={createSection}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <span className="font-semibold">Taskflow</span>

        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
                <Avatar className="size-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="text-xs">{initialsOf(profile)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="truncate font-medium">
                  {profile?.full_name || profile?.email}
                </span>
                <Badge variant="secondary" className="w-fit font-normal">
                  {ROLE_LABELS[role]}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r md:block">
          <SidebarNav sections={sections} createSection={createSection} />
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet context={{ sections, createSection }} />
        </main>
      </div>
    </div>
  );
}
