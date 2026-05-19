import Image from "next/image";
import type { SharpModel } from "@/lib/types";

type ModelSelectorProps = {
  models: SharpModel[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
};

export function ModelSelector({
  models,
  selectedModelId,
  onSelectModel,
}: ModelSelectorProps) {
  return (
    <section className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src="/brand/altech.png"
              alt="Altech"
              width={600}
              height={325}
              className="h-12 w-auto object-contain"
              priority
            />
            <span className="h-8 w-px bg-zinc-200" aria-hidden="true" />
            <Image
              src="/brand/sharp.png"
              alt="Sharp"
              width={1082}
              height={376}
              className="h-9 w-auto object-contain"
              priority
            />
          </div>
          <p className="mt-4 text-sm font-medium uppercase tracking-wide text-red-700">
            Sharp Photocopier Configurator
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Build a valid machine configuration
          </h1>
        </div>

        <label className="flex min-w-72 flex-col gap-2 text-sm font-medium text-zinc-700">
          Select model manually
          <select
            value={selectedModelId}
            onChange={(event) => onSelectModel(event.target.value)}
            className="h-12 rounded-md border border-red-600 bg-white px-3 text-base font-medium text-zinc-950 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.type} - {model.speed_ppm} ppm
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
