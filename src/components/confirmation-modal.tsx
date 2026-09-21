import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "success";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary"
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/20";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500/20";
      default:
        return "bg-hyperblue hover:bg-obsidian text-white focus:ring-hyperblue/20";
    }
  };

  const getIconContainerClass = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-50 border border-rose-100 text-rose-500";
      case "success":
        return "bg-emerald-50 border border-emerald-100 text-emerald-500";
      default:
        return "bg-hyperblue/5 border border-hyperblue/10 text-hyperblue";
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      {/* Content Container */}
      <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-border shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 size-8 flex items-center justify-center rounded-full bg-neutral-100 text-obsidian hover:bg-obsidian hover:text-white transition-all active:scale-95"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`size-12 rounded-2xl flex items-center justify-center mb-4 ${getIconContainerClass()}`}>
            <AlertTriangle className="size-6" />
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-black text-obsidian tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-xs font-medium text-steel-dark leading-relaxed mb-6 max-w-xs">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-white text-obsidian py-3 text-center text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 rounded-xl py-3 text-center text-xs font-bold uppercase tracking-widest transition-all focus:ring-2 focus:outline-none active:scale-95 shadow-sm ${getButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
