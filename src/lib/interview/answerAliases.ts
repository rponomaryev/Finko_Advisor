import { answerAliases } from "./answerMemory.ts";

function symmetricAliases(seed: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, Set<string>> = {};
  for (const [canonical, aliases] of Object.entries(seed)) {
    const values = Array.from(new Set([canonical, ...aliases]));
    for (const key of values) {
      result[key] ??= new Set<string>();
      for (const value of values) {
        if (value !== key) result[key].add(value);
      }
    }
  }
  return Object.fromEntries(Object.entries(result).map(([key, values]) => [key, Array.from(values)]));
}

export const compatibleAnswerAliases: Record<string, string[]> = {
  ...symmetricAliases(answerAliases),
  averageTicket: ["averagePrice", "averageServiceTicket", "averageWashTicket", "averageRentalTicket", "averageRepairTicket", "averageLaundryTicket", "averageGroomingTicket", "averageStorageTicket", "averageTestTicket", "averageSolarProjectTicket"],
  averagePrice: ["averageTicket", "averageServiceTicket", "averageWashTicket", "averageRentalTicket", "averageRepairTicket", "averageLaundryTicket", "averageGroomingTicket", "averageStorageTicket", "averageTestTicket", "averageSolarProjectTicket"],
  averageServiceTicket: ["averagePrice", "averageTicket"],
  averageWashTicket: ["averagePrice", "averageTicket"],
  averageMarkupPct: ["markupPct", "grossMarginPct"],
  markupPct: ["averageMarkupPct", "grossMarginPct"],
  grossMarginPct: ["averageMarkupPct", "markupPct"],
  targetCustomerSegments: ["targetCustomers"],
  targetCustomers: ["targetCustomerSegments", "customerSegments", "clientSegments", "mainClients", "b2bClients", "b2cClients", "rentalTargetCustomers"],
  equipmentList: ["laundryEquipment", "productionEquipment", "keyEquipment", "tools", "launchAssets", "equipmentCapex", "carWashEquipment", "kitchenEquipment", "groomingEquipment", "repairEquipment", "solarInstallationEquipment", "rentalEquipmentList", "labEquipmentList", "sectionNotes.equipment"],
  supplierSelected: ["supplier", "rawMaterialSource", "inventorySupplier", "productSupplier", "supplierPaymentTerms", "supplierOfferAvailable", "alternativeSuppliers", "solarSupplierPlan", "ingredientSupplyPlan", "reagentsSupplierSelected", "laundrySupplierPlan", "sectionNotes.rawMaterials", "sectionNotes.inventory"],
  returnsPolicy: ["returnPolicy", "warrantyPolicy", "complaintPolicy", "damageLiability", "serviceGuarantee", "repairWarrantyPolicy", "returnsExchangePolicy", "damageLossPolicy", "serviceTerms"],
  serviceTerms: ["clientContracts", "warrantyPolicy", "damageLiability", "repairWarrantyPolicy", "rentalClientContracts", "rentalDamageLiability", "laundryServiceTerms", "returnsExchangePolicy"]
};
