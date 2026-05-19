export type AccessoryCategory =
  | "Main Unit"
  | "Paper Drawers / Stands"
  | "Finishers"
  | "Punch Modules"
  | "Folding Units"
  | "Connectivity / Expansion"
  | "Fax / Software Kits"
  | "Storage / Security"
  | "Consumables"
  | "Output / Paper Pass";

export type RuleType =
  | "requires_one"
  | "requires_any"
  | "requires_all"
  | "incompatible_with";

export type SharpModel = {
  id: string;
  brand: string;
  series: string;
  name: string;
  type: string;
  speed_ppm: number;
};

export type Accessory = {
  id: string;
  name: string;
  category: AccessoryCategory;
  consumable_type?: "Toner" | "Developer" | "Drum" | "Maintenance";
  color?: "Black" | "Cyan" | "Magenta" | "Yellow" | "CMY" | "BK/CL";
  yield_life?: string;
  min_order_qty?: number;
  remarks?: string;
};

export type ModelAccessory = {
  model_id: string;
  accessory_id: string;
};

export type AccessoryRule = {
  model: string;
  accessory: string;
  accessory_name: string;
  rule_type: RuleType;
  required_options: string[];
  requirement_groups?: string[][];
  incompatible_with: string[];
  auto_select: boolean;
  message: string;
};

export type RuleGroup = {
  id: string;
  name: string;
  model: string | "ALL";
  accessory_ids: string[];
  min_select?: number;
  max_select?: number;
  message: string;
};

export type PackagedItem = {
  model: string;
  item: string;
  color: string;
  status: "Not bundled" | "Pre-installed" | "Installed";
};

export type MissingRequirement = {
  accessoryId: string;
  requiredOptions: string[];
  message: string;
};

export type Conflict = {
  accessoryId: string;
  conflictsWith: string;
  message: string;
};

export type ValidationResult = {
  isValid: boolean;
  selected: string[];
  autoSelected: string[];
  missingRequirements: MissingRequirement[];
  conflicts: Conflict[];
  disabledOptions: string[];
  disabledReasons: Record<string, string>;
  messages: string[];
};
