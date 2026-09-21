import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-obsidian group-[.toaster]:border-border/80 group-[.toaster]:shadow-elevated group-[.toaster]:rounded-2xl p-4 font-sans text-xs font-bold flex items-center gap-3 border transition-all duration-300",
          description: "group-[.toast]:text-steel-dark",
          actionButton: "group-[.toast]:bg-obsidian group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-surface group-[.toast]:text-steel-dark",
          success: "group-[.toast]:!bg-success/5 group-[.toast]:!text-success group-[.toast]:!border-success/20",
          error: "group-[.toast]:!bg-destructive/5 group-[.toast]:!text-destructive group-[.toast]:!border-destructive/20",
          info: "group-[.toast]:!bg-hyperblue/5 group-[.toast]:!text-hyperblue group-[.toast]:!border-hyperblue/20",
          warning: "group-[.toast]:!bg-warning/10 group-[.toast]:!text-warning group-[.toast]:!border-warning/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
