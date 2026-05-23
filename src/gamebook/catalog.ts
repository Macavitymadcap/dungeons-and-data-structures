import { Adventure } from "./model.ts";

export function itemName(adventure: Adventure, itemId: string): string {
  return adventure.items?.find((item) => item.id === itemId)?.name ?? itemId;
}

export function discoveryName(adventure: Adventure, flagId: string): string {
  return adventure.discoveries?.find((discovery) => discovery.id === flagId)?.name ??
    flagId;
}

export function itemList(adventure: Adventure, itemIds: string[]): string {
  return itemIds.map((itemId) => itemName(adventure, itemId)).join(", ") || "Empty";
}

export function discoveryList(adventure: Adventure, flagIds: string[]): string {
  return flagIds.map((flagId) => discoveryName(adventure, flagId)).join(", ") ||
    "None";
}
