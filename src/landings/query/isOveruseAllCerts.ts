import { TOLERANCE_IN_KG } from "../../data/constants";
import { ICatchCertificateLanding, IConsolidateLandingItem } from "../../types";
import { isRetrospectiveCheckRequired } from "./isWithinRetrospectivePeriod";

export const isOverusedAllCerts: (item: IConsolidateLandingItem) => boolean = (item: IConsolidateLandingItem): boolean => {
  if (!item || !Array.isArray(item.landings) || item.landings.length <= 1)
    return false;

  const isHighRisk = item.landings.some((l: ICatchCertificateLanding) => l.isHighRisk && isRetrospectiveCheckRequired(l));
  if (!isHighRisk) {
    return false;
  }

  const isPreApproved = item.landings.every((l: ICatchCertificateLanding) => l.isPreApproved);
  if (isPreApproved) {
    return false;
  }

  const isUsageAcrossMultipleCert = new Set(item.landings.reduce((ls: string[], l: ICatchCertificateLanding) => (!l.isPreApproved) ? [...ls, l.documentNumber] : ls, [])).size > 1;
  if (!isUsageAcrossMultipleCert || !item.landedWeight) {
    return false;
  }

  return item.isEstimate 
    ? (item.exportWeight > ((item.landedWeight * 1.1) + TOLERANCE_IN_KG)) 
    : (item.exportWeight > (item.landedWeight + TOLERANCE_IN_KG));
}