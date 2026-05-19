import accessoriesData from "@/data/accessories.json";
import accessoryRulesData from "@/data/accessoryRules.json";
import modelPackagedItemsData from "@/data/modelPackagedItems.json";
import modelAccessoriesData from "@/data/modelAccessories.json";
import ruleGroupsData from "@/data/ruleGroups.json";
import type {
  Accessory,
  AccessoryRule,
  Conflict,
  MissingRequirement,
  ModelAccessory,
  PackagedItem,
  RuleGroup,
  ValidationResult,
} from "@/lib/types";

const accessories = accessoriesData as Accessory[];
const modelAccessories = modelAccessoriesData as ModelAccessory[];
const modelPackagedItems = modelPackagedItemsData as PackagedItem[];
const accessoryRules = accessoryRulesData as AccessoryRule[];
const ruleGroups = ruleGroupsData as RuleGroup[];
const accessoryById = new Map(accessories.map((accessory) => [accessory.id, accessory]));

const unique = (items: string[]) => Array.from(new Set(items));

const getRequirementGroups = (rule: AccessoryRule) =>
  rule.requirement_groups?.length ? rule.requirement_groups : [rule.required_options];

export function getCompatibleAccessoryIds(modelId: string) {
  return modelAccessories
    .filter((item) => item.model_id === modelId)
    .map((item) => item.accessory_id);
}

export function getAccessoriesByIds(accessoryIds: string[]) {
  const requestedIds = new Set(accessoryIds);
  return accessories.filter((accessory) => requestedIds.has(accessory.id));
}

export function getRulesForModel(modelId: string) {
  return accessoryRules.filter(
    (rule) => rule.model === "ALL" || rule.model === modelId,
  );
}

export function getRuleGroupsForModel(modelId: string) {
  return ruleGroups.filter(
    (group) => group.model === "ALL" || group.model === modelId,
  );
}

export function getRuleForAccessory(modelId: string, accessoryId: string) {
  return getRulesForModel(modelId).find((rule) => rule.accessory === accessoryId);
}

export function getPackagedItemsForModel(modelId: string) {
  return modelPackagedItems.filter((item) => item.model === modelId);
}

export function validateConfiguration(
  modelId: string,
  selectedAccessoryIds: string[],
): ValidationResult {
  const rules = getRulesForModel(modelId);
  const groups = getRuleGroupsForModel(modelId);
  const compatibleAccessoryIds = new Set(getCompatibleAccessoryIds(modelId));
  const selected = new Set(
    unique(selectedAccessoryIds).filter((id) => compatibleAccessoryIds.has(id)),
  );
  const autoSelected = new Set<string>();

  let changed = true;

  // Auto-selection only applies when a selected accessory has exactly one required
  // compatible option and the rule explicitly allows automation. Multi-choice
  // requirements remain user decisions and are reported as missing instead.
  while (changed) {
    changed = false;

    for (const rule of rules) {
      if (!selected.has(rule.accessory) || !rule.auto_select) {
        continue;
      }

      for (const requirementGroup of getRequirementGroups(rule)) {
        const compatibleRequiredOptions = requirementGroup.filter((id) =>
          compatibleAccessoryIds.has(id),
        );
        const hasRequiredOption = compatibleRequiredOptions.some((id) =>
          selected.has(id),
        );

        if (
          !hasRequiredOption &&
          compatibleRequiredOptions.length === 1 &&
          !selected.has(compatibleRequiredOptions[0])
        ) {
          selected.add(compatibleRequiredOptions[0]);
          autoSelected.add(compatibleRequiredOptions[0]);
          changed = true;
        }
      }
    }
  }

  const finalSelected = Array.from(selected);
  const missingRequirements: MissingRequirement[] = [];
  const conflicts: Conflict[] = [];

  for (const rule of rules) {
    if (!selected.has(rule.accessory)) {
      continue;
    }

    for (const requirementGroup of getRequirementGroups(rule)) {
      if (requirementGroup.length === 0) {
        continue;
      }

      const compatibleRequiredOptions = requirementGroup.filter((id) =>
        compatibleAccessoryIds.has(id),
      );
      const hasRequiredOption = compatibleRequiredOptions.some((id) =>
        selected.has(id),
      );

      if (!hasRequiredOption) {
        missingRequirements.push({
          accessoryId: rule.accessory,
          requiredOptions: compatibleRequiredOptions.length
            ? compatibleRequiredOptions
            : requirementGroup,
          message: rule.message,
        });
      }
    }

    for (const incompatibleId of rule.incompatible_with) {
      if (selected.has(incompatibleId)) {
        conflicts.push({
          accessoryId: rule.accessory,
          conflictsWith: incompatibleId,
          message: rule.message,
        });
      }
    }
  }

  // Option groups model Sharp's "choose one of this family" logic. A finisher
  // group, for example, can allow BP-FN15 or BP-FN16 but never both.
  for (const group of groups) {
    const selectedInGroup = group.accessory_ids.filter((id) => selected.has(id));

    if (group.max_select && selectedInGroup.length > group.max_select) {
      const [firstSelected, ...extraSelected] = selectedInGroup;

      for (const extraId of extraSelected) {
        conflicts.push({
          accessoryId: extraId,
          conflictsWith: firstSelected,
          message: group.message,
        });
      }
    }
  }

  // Disabled options are compatible accessories that would be invalid to add
  // because an already selected item declares them incompatible, or because they
  // declare an incompatibility against something already selected.
  const disabledReasons: Record<string, string> = {};

  const disabledOptions = getCompatibleAccessoryIds(modelId).filter((candidateId) => {
    if (selected.has(candidateId)) {
      return false;
    }

    const candidateRule = rules.find((rule) => rule.accessory === candidateId);
    const blockedSelectedId = candidateRule?.incompatible_with.find((id) =>
      selected.has(id),
    );
    const candidateBlocksSelected = Boolean(blockedSelectedId);
    const selectedBlockingRule = finalSelected
      .map((selectedId) => rules.find((rule) => rule.accessory === selectedId))
      .find((selectedRule) => selectedRule?.incompatible_with.includes(candidateId));
    const selectedBlocksCandidate = Boolean(selectedBlockingRule);
    const hasUnmetConsumableRequirement = candidateRule
      ? accessoryById.get(candidateId)?.category === "Consumables" &&
        getRequirementGroups(candidateRule).some((requirementGroup) => {
        if (requirementGroup.length === 0) {
          return false;
        }

        return !requirementGroup
          .filter((id) => compatibleAccessoryIds.has(id))
          .some((id) => selected.has(id));
        })
      : false;
    const limitingGroup = groups.find((group) => {
      if (!group.max_select || !group.accessory_ids.includes(candidateId)) {
        return false;
      }

      const selectedInGroup = group.accessory_ids.filter((id) =>
        selected.has(id),
      );

      return selectedInGroup.length >= group.max_select;
    });

    if (candidateBlocksSelected && candidateRule) {
      disabledReasons[candidateId] = candidateRule.message;
    }

    if (selectedBlocksCandidate && selectedBlockingRule) {
      disabledReasons[candidateId] = selectedBlockingRule.message;
    }

    if (limitingGroup) {
      disabledReasons[candidateId] = limitingGroup.message;
    }

    if (hasUnmetConsumableRequirement && candidateRule) {
      disabledReasons[candidateId] = candidateRule.message;
    }

    return (
      candidateBlocksSelected ||
      selectedBlocksCandidate ||
      hasUnmetConsumableRequirement ||
      Boolean(limitingGroup)
    );
  });

  const messages = [
    ...missingRequirements.map((requirement) => requirement.message),
    ...conflicts.map((conflict) => conflict.message),
  ];

  return {
    isValid: missingRequirements.length === 0 && conflicts.length === 0,
    selected: finalSelected,
    autoSelected: Array.from(autoSelected),
    missingRequirements,
    conflicts,
    disabledOptions,
    disabledReasons,
    messages,
  };
}
