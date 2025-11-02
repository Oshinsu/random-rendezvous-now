import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useCommandPalette } from '@/hooks/useCommandPalette';

export const CommandPalette = () => {
  const { open, setOpen, commands } = useCommandPalette();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une page ou action..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => {
                command.action();
                setOpen(false);
              }}
            >
              <span className="mr-2">{command.icon}</span>
              {command.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
