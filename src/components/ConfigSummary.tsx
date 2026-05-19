import Image from "next/image";
import { ValidationMessage } from "@/components/ValidationMessage";
import type {
  Accessory,
  PackagedItem,
  SharpModel,
  ValidationResult,
} from "@/lib/types";

type ConfigSummaryProps = {
  model: SharpModel;
  selectedAccessories: Accessory[];
  packagedItems: PackagedItem[];
  validation: ValidationResult;
};

const labelFor = (accessories: Accessory[], id: string) => {
  const accessory = accessories.find((item) => item.id === id);
  return accessory ? `${accessory.id} - ${accessory.name}` : id;
};

const formatDate = () =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

export function ConfigSummary({
  model,
  selectedAccessories,
  packagedItems,
  validation,
}: ConfigSummaryProps) {
  const selectedIds = validation.selected;
  const selectedConsumables = selectedIds
    .map((id) => selectedAccessories.find((accessory) => accessory.id === id))
    .filter((accessory): accessory is Accessory => Boolean(accessory))
    .filter((accessory) => accessory.category === "Consumables");

  const selectedNonConsumables = selectedIds
    .map((id) => selectedAccessories.find((accessory) => accessory.id === id))
    .filter((accessory): accessory is Accessory => Boolean(accessory))
    .filter((accessory) => accessory.category !== "Consumables");

  const handleDownloadPdf = async () => {
    if (!validation.isValid) {
      return;
    }

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const imageAsDataUrl = async (src: string) => {
      const response = await fetch(src);
      const blob = await response.blob();

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const addLine = (text: string, size = 10, style: "normal" | "bold" = "normal") => {
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * (size * 0.45) + 3;
    };

    const addSection = (title: string) => {
      y += 3;
      doc.setDrawColor(210);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;
      addLine(title, 12, "bold");
    };

    try {
      const [altechLogo, sharpLogo] = await Promise.all([
        imageAsDataUrl("/brand/altech.png"),
        imageAsDataUrl("/brand/sharp.png"),
      ]);

      doc.addImage(altechLogo, "PNG", margin, y - 4, 34, 11);
      doc.addImage(sharpLogo, "PNG", pageWidth - margin - 34, y - 4, 34, 10);
      y += 16;
    } catch {
      y += 2;
    }

    addLine("Sharp Photocopier Configuration", 18, "bold");
    addLine(`Generated: ${formatDate()}`, 9);
    addLine(`Status: ${validation.isValid ? "Valid" : "Invalid"}`, 10, "bold");

    addSection("Main Model");
    addLine(`${model.name} - ${model.series} - ${model.type} - ${model.speed_ppm} ppm`);

    addSection("Selected Accessories");
    if (selectedNonConsumables.length) {
      selectedNonConsumables.forEach((accessory) => {
        addLine(`- ${accessory.id} - ${accessory.name}`);
      });
    } else {
      addLine("None");
    }

    addSection("Selected Consumables");
    if (selectedConsumables.length) {
      selectedConsumables.forEach((consumable) => {
        addLine(
          `- ${consumable.id} - ${consumable.name}${
            consumable.color ? ` - ${consumable.color}` : ""
          }${consumable.yield_life ? ` - ${consumable.yield_life}` : ""}`,
        );
      });
    } else {
      addLine("None");
    }

    addSection("Auto-selected Accessories");
    if (validation.autoSelected.length) {
      validation.autoSelected.forEach((id) => addLine(`- ${labelFor(selectedAccessories, id)}`));
    } else {
      addLine("None");
    }

    addSection("Packaged Consumables");
    if (packagedItems.length) {
      packagedItems.forEach((item) => {
        addLine(`- ${item.item} ${item.color}: ${item.status}`);
      });
    } else {
      addLine("No packaged consumable data available for this model.");
    }

    addSection("Validation");
    addLine("No missing requirements or conflicts.");

    doc.save(`${model.id}-configuration.pdf`);
  };

  return (
    <aside className="sticky top-6 flex flex-col gap-4 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <Image
          src="/brand/altech.png"
          alt="Altech"
          width={600}
          height={325}
          className="h-10 w-auto object-contain"
        />
        <Image
          src="/brand/sharp.png"
          alt="Sharp"
          width={1082}
          height={376}
          className="h-8 w-auto object-contain"
        />
      </div>
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Configuration Summary
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-zinc-950">{model.name}</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {model.series} - {model.type} - {model.speed_ppm} ppm
        </p>
      </div>

      <ValidationMessage tone={validation.isValid ? "success" : "warning"}>
        {validation.isValid
          ? "Configuration is valid."
          : "Configuration needs attention before it is complete."}
      </ValidationMessage>

      <button
        type="button"
        disabled={!validation.isValid}
        onClick={handleDownloadPdf}
        className={[
          "rounded-md px-4 py-3 text-sm font-semibold transition",
          validation.isValid
            ? "bg-red-700 text-white hover:bg-red-800"
            : "cursor-not-allowed bg-zinc-200 text-zinc-500",
        ].join(" ")}
      >
        Download PDF
      </button>

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">
          Selected accessories
        </h3>
        {selectedIds.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            {selectedIds.map((id) => (
              <li
                key={id}
                className="flex items-start justify-between gap-3 rounded border border-zinc-200 px-3 py-2"
              >
                <span>{labelFor(selectedAccessories, id)}</span>
                {validation.autoSelected.includes(id) ? (
                  <span className="shrink-0 rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800">
                    Auto
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No accessories selected.</p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">
          Packaged consumables
        </h3>
        {packagedItems.length > 0 ? (
          <ul className="mt-2 space-y-2 text-sm text-zinc-700">
            {packagedItems.map((item) => (
              <li
                key={`${item.item}-${item.color}`}
                className="flex items-center justify-between gap-3 rounded border border-zinc-200 px-3 py-2"
              >
                <span>
                  {item.item} {item.color}
                </span>
                <span
                  className={[
                    "shrink-0 rounded px-2 py-1 text-xs font-medium",
                    item.status === "Not bundled"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-100 text-emerald-800",
                  ].join(" ")}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            No packaged consumable data for this model yet.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">
          Selected consumables
        </h3>
        {selectedConsumables.length > 0 ? (
          <ul className="mt-2 space-y-2 text-sm text-zinc-700">
            {selectedConsumables.map((consumable) => (
              <li
                key={consumable.id}
                className="rounded border border-zinc-200 px-3 py-2"
              >
                <span className="block font-medium">
                  {consumable.id} - {consumable.name}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {[
                    consumable.color,
                    consumable.yield_life,
                    consumable.min_order_qty
                      ? `MOQ ${consumable.min_order_qty}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" - ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            No consumables selected.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">
          Auto-selected accessories
        </h3>
        {validation.autoSelected.length > 0 ? (
          <ul className="mt-2 space-y-2 text-sm text-zinc-700">
            {validation.autoSelected.map((id) => (
              <li key={id}>{labelFor(selectedAccessories, id)}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">None.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-950">
          Missing required accessories
        </h3>
        {validation.missingRequirements.length > 0 ? (
          validation.missingRequirements.map((requirement) => (
            <ValidationMessage
              key={`${requirement.accessoryId}-${requirement.requiredOptions.join("-")}`}
              tone="warning"
            >
              {requirement.message}
            </ValidationMessage>
          ))
        ) : (
          <p className="text-sm text-zinc-500">No missing requirements.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-950">Conflicts</h3>
        {validation.conflicts.length > 0 ? (
          validation.conflicts.map((conflict) => (
            <ValidationMessage
              key={`${conflict.accessoryId}-${conflict.conflictsWith}`}
              tone="error"
            >
              {conflict.message}
            </ValidationMessage>
          ))
        ) : (
          <p className="text-sm text-zinc-500">No conflicts detected.</p>
        )}
      </section>
    </aside>
  );
}
