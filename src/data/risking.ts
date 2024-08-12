import { WEIGHT } from "mmo-shared-reference-data";
import { getExporterRiskScore, getRiskThreshold, getSpeciesRiskScore, getVesselRiskScore, getWeighting } from "./cache";

export const isHighRisk = (riskScore: number): boolean => riskScore > getRiskThreshold();

export function getTotalRiskScore(pln: string, speciesCode: string, exporterAccountId: string, exporterContactId: string): number {
  const vesselRiskScore = getVesselOfInterestRiskScore(pln);
  const speciesRiskScore = getExportedSpeciesRiskScore(speciesCode);
  const exporterRiskScore = getExporterBehaviourRiskScore(exporterAccountId, exporterContactId);

  return vesselRiskScore * speciesRiskScore * exporterRiskScore;
}

export function getVesselOfInterestRiskScore(pln: string): number {
  return calcRiskScore(getVesselRiskScore(pln), getWeighting(WEIGHT.VESSEL));
}

export function getExportedSpeciesRiskScore(speciesCode: string): number {
  return calcRiskScore(getSpeciesRiskScore(speciesCode), getWeighting(WEIGHT.SPECIES));
}

export function getExporterBehaviourRiskScore(exporterAccountId: string, exporterContactId: string): number {
  return calcRiskScore(getExporterRiskScore(exporterAccountId, exporterContactId), getWeighting(WEIGHT.EXPORTER));
}

export function calcRiskScore(score: number, weighting: number): number {
  return score * weighting;
}