import { getRuleForAccessory } from "@/lib/validationEngine";
import type { Accessory } from "@/lib/types";

type AccessoryCardProps = {
  accessory: Accessory;
  modelId: string;
  isSelected: boolean;
  isDisabled: boolean;
  isAutoSelected: boolean;
  disabledReason?: string;
  onToggle: (accessoryId: string) => void;
};

export function AccessoryCard({
  accessory,
  modelId,
  isSelected,
  isDisabled,
  isAutoSelected,
  disabledReason,
  onToggle,
}: AccessoryCardProps) {
  const rule = getRuleForAccessory(modelId, accessory.id);

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onToggle(accessory.id)}
      className={[
        "group flex min-h-32 w-full flex-col justify-between rounded-md border p-4 text-left transition",
        isSelected
          ? "border-red-700 bg-red-50 shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50",
        isDisabled ? "cursor-not-allowed opacity-45 hover:border-zinc-200" : "",
      ].join(" ")}
    >
      <span>
        <span className="flex items-start justify-between gap-3">
          <span className="font-semibold text-zinc-950">{accessory.id}</span>
          {isAutoSelected ? (
            <span className="rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800">
              Auto-selected
            </span>
          ) : null}
          {isSelected && !isAutoSelected ? (
            <span className="rounded bg-red-700 px-2 py-1 text-xs font-medium text-white">
              Selected
            </span>
          ) : null}
        </span>
        <span className="mt-2 block text-sm leading-6 text-zinc-700">
          {accessory.name}
        </span>
        {accessory.remarks ? (
          <span className="mt-2 block text-xs leading-5 text-zinc-500">
            Remarks: {accessory.remarks}
          </span>
        ) : null}
        {accessory.category === "Consumables" ? (
          <span className="mt-3 grid gap-1 text-xs leading-5 text-zinc-600">
            {accessory.consumable_type ? (
              <span>Type: {accessory.consumable_type}</span>
            ) : null}
            {accessory.color ? <span>Color: {accessory.color}</span> : null}
            {accessory.yield_life ? (
              <span>Yield / life: {accessory.yield_life}</span>
            ) : null}
            {accessory.min_order_qty ? (
              <span>Min. order qty: {accessory.min_order_qty}</span>
            ) : null}
          </span>
        ) : null}
      </span>

      {isDisabled && disabledReason ? (
        <span className="mt-4 block border-t border-zinc-200 pt-3 text-xs font-medium leading-5 text-red-700">
          {disabledReason}
        </span>
      ) : rule ? (
        <span className="mt-4 block border-t border-zinc-200 pt-3 text-xs leading-5 text-zinc-500">
          {rule.message}
        </span>
      ) : (
        <span className="mt-4 block border-t border-zinc-200 pt-3 text-xs leading-5 text-zinc-500">
          No additional dependency rules.
        </span>
      )}
    </button>
  );
}
