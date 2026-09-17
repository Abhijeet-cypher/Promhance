import { Check, Zap, History } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Check,   label: "Free Forever" },
  { icon: Check,   label: "No Login Required" },
  { icon: History, label: "Prompt History Saved" },
  { icon: Zap,     label: "Instant Results" },
] as const;

export default function TrustStrip() {
  return (
    <div className="w-full flex justify-center items-center py-4 gap-0">
      {TRUST_ITEMS.map(({ icon: Icon, label }, i) => (
        <span key={label} className="inline-flex items-center">
          {/* Trust item */}
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#a1a1a1] whitespace-nowrap">
            <Icon
              className="w-3 h-3 text-blue-400 flex-shrink-0"
              strokeWidth={2.5}
            />
            {label}
          </span>
          {/* Dot separator — not after last item */}
          {i < TRUST_ITEMS.length - 1 && (
            <span className="mx-5 text-[#2a2a2a] select-none text-[10px]">·</span>
          )}
        </span>
      ))}
    </div>
  );
}
