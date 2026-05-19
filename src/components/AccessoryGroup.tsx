import { AccessoryCard } from "@/components/AccessoryCard";
import type { Accessory, ValidationResult } from "@/lib/types";

type AccessoryGroupProps = {
  category: string;
  accessories: Accessory[];
  modelId: string;
  validation: ValidationResult;
  onToggleAccessory: (accessoryId: string) => void;
};

export function AccessoryGroup({
  category,
  accessories,
  modelId,
  validation,
  onToggleAccessory,
}: AccessoryGroupProps) {
  if (accessories.length === 0) {
    return null;
  }

  return (
    <section className="scroll-mt-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-950">{category}</h2>
        <span className="text-sm text-zinc-500">{accessories.length} options</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {accessories.map((accessory) => (
          <AccessoryCard
            key={accessory.id}
            accessory={accessory}
            modelId={modelId}
            isSelected={validation.selected.includes(accessory.id)}
            isDisabled={validation.disabledOptions.includes(accessory.id)}
            isAutoSelected={validation.autoSelected.includes(accessory.id)}
            disabledReason={validation.disabledReasons[accessory.id]}
            onToggle={onToggleAccessory}
          />
        ))}
      </div>
    </section>
  );
}
