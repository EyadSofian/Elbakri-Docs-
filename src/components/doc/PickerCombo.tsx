import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function PickerCombo<T extends { id: string; name: string }>({
  items, value, onPick, placeholder = "Select…",
}: {
  items: T[];
  value?: string;
  onPick: (item: T | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = items.find(i => i.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {current ? current.name : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => { onPick(null); setOpen(false); }}>
                <span className="text-muted-foreground">— Clear —</span>
              </CommandItem>
              {items.map(it => (
                <CommandItem key={it.id} value={it.name} onSelect={() => { onPick(it); setOpen(false); }}>
                  <Check className={cn("mr-2 size-3.5", value === it.id ? "opacity-100" : "opacity-0")} />
                  {it.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
