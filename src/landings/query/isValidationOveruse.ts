import { ICcQueryResult } from "mmo-shared-reference-data";
import { getTotalRiskScore, isHighRisk } from "../../data/risking";

export const isValidationOveruse = (item: ICcQueryResult): boolean =>
  item.isSpeciesExists &&
  !item.isOverusedThisCert &&
  !item.isPreApproved &&
  isHighRisk(getTotalRiskScore(item.extended.pln, item.species, item.extended.exporterAccountId, item.extended.exporterContactId)) &&
  item.isOverusedAllCerts