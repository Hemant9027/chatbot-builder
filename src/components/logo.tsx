import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="#1B1714" />
      <path
        d="M8 22.5V9.5h3v10h5.5v3H8Z"
        fill="#F8F6F3"
        opacity="0.95"
      />
      <path
        d="M17 9.5h6.5L19 22.5h-3.3l4.6-10h-3.3v-3Z"
        fill="#E8553A"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-8 shrink-0" />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[17px] font-semibold tracking-tight text-ink-900">
            InfyCrest <span className="text-brand-600">GuestAI</span>
          </span>
          <span className="mt-0.5 block text-[10px] font-medium tracking-[0.14em] text-ink-400 uppercase">
            Hospitality intelligence
          </span>
        </span>
      )}
    </span>
  );
}
