"use client";

import { useMemo, useState } from "react";
import { AccessoryGroup } from "@/components/AccessoryGroup";
import { ConfigSummary } from "@/components/ConfigSummary";
import { ModelSelector } from "@/components/ModelSelector";
import { ValidationMessage } from "@/components/ValidationMessage";
import modelsData from "@/data/models.json";
import {
  getAccessoriesByIds,
  getCompatibleAccessoryIds,
  getPackagedItemsForModel,
  validateConfiguration,
} from "@/lib/validationEngine";
import type { Accessory, SharpModel } from "@/lib/types";

const models = modelsData as SharpModel[];

const categoryOrder = [
  "Main Unit",
  "Paper Drawers / Stands",
  "Finishers",
  "Punch Modules",
  "Folding Units",
  "Output / Paper Pass",
  "Connectivity / Expansion",
  "Fax / Software Kits",
  "Storage / Security",
  "Consumables",
];

const unique = (items: string[]) => Array.from(new Set(items));

export default function Home() {
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id ?? "");
  const [manualAccessoryIds, setManualAccessoryIds] = useState<string[]>([]);
  const [autoAccessoryIds, setAutoAccessoryIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedModel =
    models.find((model) => model.id === selectedModelId) ?? models[0];

  const validation = useMemo(
    () =>
      validateConfiguration(
        selectedModelId,
        unique([...manualAccessoryIds, ...autoAccessoryIds]),
      ),
    [selectedModelId, manualAccessoryIds, autoAccessoryIds],
  );

  const compatibleAccessories = useMemo(() => {
    const compatibleIds = getCompatibleAccessoryIds(selectedModelId);
    return getAccessoriesByIds(compatibleIds);
  }, [selectedModelId]);

  const accessoriesByCategory = useMemo(() => {
    return categoryOrder.reduce<Record<string, Accessory[]>>((groups, category) => {
      groups[category] =
        category === "Main Unit"
          ? []
          : compatibleAccessories.filter(
              (accessory) => accessory.category === category,
            );
      return groups;
    }, {});
  }, [compatibleAccessories]);

  const packagedItems = getPackagedItemsForModel(selectedModelId);

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setManualAccessoryIds([]);
    setAutoAccessoryIds([]);
    setNotice(null);
  };

  const handleToggleAccessory = (accessoryId: string) => {
    if (validation.disabledOptions.includes(accessoryId)) {
      setNotice(
        validation.disabledReasons[accessoryId] ??
          "This accessory is disabled because it conflicts with the current configuration.",
      );
      return;
    }

    if (validation.selected.includes(accessoryId)) {
      const nextManualIds = manualAccessoryIds.filter((id) => id !== accessoryId);
      const nextValidation = validateConfiguration(selectedModelId, nextManualIds);
      setManualAccessoryIds(nextManualIds);
      setAutoAccessoryIds(nextValidation.autoSelected);
      setNotice(null);
      return;
    }

    const nextManualIds = unique([...manualAccessoryIds, accessoryId]);
    const nextValidation = validateConfiguration(selectedModelId, [
      ...nextManualIds,
      ...autoAccessoryIds,
    ]);

    if (nextValidation.conflicts.length > 0) {
      setNotice(nextValidation.conflicts[0].message);
      return;
    }

    setManualAccessoryIds(nextManualIds);
    setAutoAccessoryIds(nextValidation.autoSelected);
    setNotice(null);
  };

  return (
    <main className="min-h-screen bg-zinc-100">
      <ModelSelector
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={handleSelectModel}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <div className="space-y-6">
          <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Main Unit</p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                  {selectedModel.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {selectedModel.brand} {selectedModel.series} -{" "}
                  {selectedModel.type}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 px-4 py-3 text-right">
                <p className="text-sm text-zinc-500">Engine speed</p>
                <p className="text-2xl font-semibold text-zinc-950">
                  {selectedModel.speed_ppm} ppm
                </p>
              </div>
            </div>
          </section>

          {notice ? <ValidationMessage tone="error">{notice}</ValidationMessage> : null}

          {validation.missingRequirements.length > 0 ? (
            <div className="space-y-2">
              {validation.missingRequirements.map((requirement) => (
                <ValidationMessage
                  key={`${requirement.accessoryId}-${requirement.requiredOptions.join("-")}`}
                  tone="warning"
                >
                  {requirement.message}
                </ValidationMessage>
              ))}
            </div>
          ) : null}

          {compatibleAccessories.length === 0 ? (
            <ValidationMessage tone="info">
              Accessory data has not been loaded for {selectedModel.name} yet.
              Select another model with mapped options, or add this model&apos;s
              option table from the master reference.
            </ValidationMessage>
          ) : null}

          {categoryOrder.map((category) => (
            <AccessoryGroup
              key={category}
              category={category}
              accessories={accessoriesByCategory[category] ?? []}
              modelId={selectedModelId}
              validation={validation}
              onToggleAccessory={handleToggleAccessory}
            />
          ))}
        </div>

        <ConfigSummary
          model={selectedModel}
          selectedAccessories={compatibleAccessories}
          packagedItems={packagedItems}
          validation={validation}
        />
      </div>
    </main>
  );
}
