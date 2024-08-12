import { LandingSources } from "mmo-shared-reference-data";
import { ICatchCertificateLanding, IConsolidateLandingItem } from "../../types";
import { TOLERANCE_IN_KG } from "../../data/constants";
import { isRetrospectiveCheckRequired } from "./isWithinRetrospectivePeriod";

export const isWithinDeminimus: (item: IConsolidateLandingItem, source: LandingSources, landedWeightBySpecies: any) => boolean = (item: IConsolidateLandingItem, source: LandingSources, landedWeightBySpecies: any) =>
  source === LandingSources.ELog &&
  !landedWeightBySpecies &&
  Array.isArray(item?.landings) &&
  item.landings.some((landing: ICatchCertificateLanding) => landing.weight <= TOLERANCE_IN_KG && isRetrospectiveCheckRequired(landing));