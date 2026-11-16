import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info" | "success" | "primary";
  variant?: "danger" | "warning" | "info" | "success" | "primary";
  isLoading?: boolean;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = "Confirm",
  confirmLabel,
  cancelText = "Cancel",
  cancelLabel,
  type,
  variant,
  isLoading = false,
  loading = false,
}) => {
  const rawType = type || variant || "warning";
  const dialogType: "danger" | "warning" | "info" | "success" =
    rawType === "primary" ? "info" : rawType;
  const activeLoading = isLoading || loading;
  const resolvedConfirmText = confirmLabel || confirmText;
  const resolvedCancelText = cancelLabel || cancelText;
  const resolvedMessage = description || message || "";

  const iconConfig = {
    danger: {
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border-red-200 dark:border-red-800",
      btnVariant: "danger" as const,
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
      btnVariant: "primary" as const,
    },
    info: {
      icon: Info,
      color: "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800",
      btnVariant: "primary" as const,
    },
    success: {
      icon: CheckCircle2,
      color: "text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800",
      btnVariant: "primary" as const,
    },
  }[dialogType];

  const IconComponent = iconConfig.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center p-2">
        <div className={`p-3.5 rounded-2xl border mb-4 ${iconConfig.color}`}>
          <IconComponent className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-navy-900 dark:text-white tracking-tight mb-2">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400 leading-relaxed mb-6">
          {resolvedMessage}
        </p>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={activeLoading}
          >
            {resolvedCancelText}
          </Button>
          <Button
            variant={iconConfig.btnVariant}
            size="md"
            fullWidth
            isLoading={activeLoading}
            onClick={onConfirm}
          >
            {resolvedConfirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
