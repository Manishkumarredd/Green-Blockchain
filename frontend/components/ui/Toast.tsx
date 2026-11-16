import React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useApp, ToastMessage } from "../common/AppContext";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const iconConfig = {
    success: {
      icon: CheckCircle2,
      color: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    },
    info: {
      icon: Info,
      color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800",
    },
  }[toast.type];

  const IconComponent = iconConfig.icon;

  return (
    <div className="pointer-events-auto bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-xl p-4 flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 duration-200">
      <div className={`p-1.5 rounded-xl border flex-shrink-0 ${iconConfig.color}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-navy-900 dark:text-white leading-tight">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="mt-0.5 text-xs text-navy-500 dark:text-navy-400 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200 p-1 rounded-lg transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
