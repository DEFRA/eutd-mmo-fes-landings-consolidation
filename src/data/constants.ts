import { LandingSources } from "mmo-shared-reference-data";

export const TOLERANCE_IN_KG = 50;

export const getLandingSource = (landingSource: string): LandingSources => {
  switch (landingSource) {
    case "ELOG":
      return LandingSources.ELog
    case "CATCH_RECORDING":
      return LandingSources.CatchRecording
    default:
      return LandingSources.LandingDeclaration 
  }
} 