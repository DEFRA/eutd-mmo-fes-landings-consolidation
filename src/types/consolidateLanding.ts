import { LandingSources } from 'mmo-shared-reference-data';
import { Schema, model } from 'mongoose';

export interface ICatchCertificateLanding {
  landingId: string,
  documentNumber: string,
  weight?: number, // must be live weight weight * factor, weight entered by the exporter
  dataEverExpected?: boolean,
  landingDataExpectedDate?: string,
  landingDataEndDate?: string,
  isHighRisk?: boolean,
  isPreApproved?: boolean
}

export interface ICatchCertificateSpecies extends ICatchCertificateLanding {
  species: string
}

export interface IConsolidateLandingItem {
  species: string,
  landedWeight?: number, // weight as recorded by CFEAS
  isEstimate?: boolean,
  exportWeight?: number, // total weight within all certificates
  isOverusedAllCerts?: boolean,
  isWithinDeminimus?: boolean,
  landings?: ICatchCertificateLanding[] // landings as entered by exporter
}

export interface IConsolidateLanding {
  rssNumber:  string,
  dateLanded: string,
  source?: LandingSources,
  items: IConsolidateLandingItem[]
}

const CatchCertificateLandingsSchema = new Schema({
  landingId:                { type: String,  required: true  },
  documentNumber:           { type: String,  required: true  },
  weight:                   { type: Number,  required: false },
  dataEverExpected:         { type: Boolean, required: false },
  landingDataExpectedDate:  { type: String,  required: false },
  landingDataEndDate:       { type: String,  required: false },
  isHighRisk:               { type: Boolean, required: false },
  isPreApproved:            { type: Boolean, required: false }
});

const ConsolidateLandingItemSchema = new Schema({
  species:            { type: String,  required: true  },
  landedWeight:       { type: Number,  required: true  },
  isEstimate:         { type: Boolean, required: true  },
  exportWeight:       { type: Number,  required: false },
  isOverusedAllCerts: { type: Boolean, required: false },
  isWithinDeminimus:  { type: Boolean, required: false },
  landings:           [ CatchCertificateLandingsSchema ]
});

const ConsolidateLandingSchema = new Schema({
  rssNumber:          { type: String, required: true  },
  dateLanded:         { type: Date,   required: true  },
  source:             { type: String, require:  false, enum: [ LandingSources.LandingDeclaration, LandingSources.CatchRecording, LandingSources.ELog ] },             
  items:              [ ConsolidateLandingItemSchema ]
});

export const ConsolidateLandingModel = model<IConsolidateLanding>('ConsolidateLanding', ConsolidateLandingSchema);