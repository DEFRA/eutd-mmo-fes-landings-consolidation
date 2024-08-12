import { ILanding } from "mmo-shared-reference-data"

export interface IConsolidateLandingDates {
  startDate: string,
  endDate: string
}

export interface IUpdateConsolidateLanding {
  documentNumber: string
}

export interface IUpdateLandings {
  landings: ILanding[]
}