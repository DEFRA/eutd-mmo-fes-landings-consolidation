import { Schema, model, Document } from 'mongoose';
import { DocumentStatuses } from 'mmo-shared-reference-data';

export enum LandingValidationStatus {
  Pending = 'PENDING_LANDING_DATA',
  Complete = 'HAS_LANDING_DATA',
  Exceeded14Days = 'EXCEEDED_14_DAY_LIMIT',
  DataNeverExpected = 'LANDING_DATA_NEVER_EXPECTED'
}

export enum LandingsEntryOptions {
  DirectLanding = 'directLanding',
  ManualEntry = 'manualEntry',
  UploadEntry = 'uploadEntry'
}

export const LandingStatuses = Object.freeze(LandingValidationStatus);

// Query
export interface IDocumentLandingQuery { 
  pln: string, 
  dateLanded: string
}

// Catch cert
export interface ExporterDetails {
  contactId?: string;
  accountId?: string;
  addressOne: string;
  addressTwo?: string;
  buildingNumber?: string;
  subBuildingName?: string;
  buildingName?: string;
  streetName?: string;
  county?: string;
  country?: string;
  postcode: string;
  townCity?: string;
  exporterCompanyName: string;
  _dynamicsAddress: any;
  _dynamicsUser: any;
  _updated?: boolean;
}

export interface CcExporterDetails extends ExporterDetails {
  exporterFullName: string;
}

export interface State {
  code: string;
  name?: string;
  admin?: string;
}

export interface Presentation {
  code: string;
  name?: string;
  admin?: string;
}

export interface Catch {
  id: string;
  vessel?: string;
  pln?: string;
  homePort?: string;
  flag?: string; // jurisdiction under whose laws the vessel is registered or licensed
  cfr?: string; // cost and freight (CFR) is a legal term
  imoNumber?: string | null;
  licenceNumber?: string;
  licenceValidTo?: string;
  licenceHolder?: string;
  date?: string;
  faoArea?: string;
  weight?: number;
  _status?: LandingValidationStatus;
  numberOfSubmissions?: number;
  vesselOverriddenByAdmin?: boolean;
  vesselNotFound?: boolean;
  dataEverExpected?: boolean;
  landingDataExpectedDate?: string;
  landingDataEndDate?: string;
  isLegallyDue?: boolean;
  vesselRiskScore?: number;
  exporterRiskScore?: number;
  speciesRiskScore?: number;
  threshold?: number;
  riskScore?: number;
  isSpeciesRiskEnabled?: boolean;
}

export interface Product {
  speciesId: string;
  species?: string;
  speciesAdmin?: string;
  speciesCode?: string;
  commodityCode?: string;
  commodityCodeAdmin?: string;
  commodityCodeDescription?: string;
  scientificName?: string;
  state?: State;
  presentation?: Presentation;
  caughtBy?: Catch[];
  factor? : number;
}

export interface Conservation {
  conservationReference: string;
}

export interface ExportData {
  products: Product[];
  transportation?: Transport;
  conservation?: Conservation;
  exporterDetails?: CcExporterDetails;
  landingsEntryOption?: LandingsEntryOptions;
}

export interface CatchCertificate {
  documentNumber: string;
  status: string;
  createdAt: Date;
  createdBy?: string;
  createdByEmail: string;
  exportData: ExportData;
  documentUri?: string;
  userReference?: string;
  requestByAdmin?: boolean;
  audit?: Audit[];
  contactId?: string;
}

export interface Audit {
  operation: string,
  at: string
}

export interface ICountry {
  officialCountryName: string;
  isoCodeAlpha2?: string;
  isoCodeAlpha3?: string;
  isoNumericCode?: string;
}

export interface BasicTransportDetails {
  vehicle: string,
  exportedFrom?: string,
  departurePlace? : string,
  exportDate? : string,
  exportedTo? : ICountry,
}

export interface Train extends BasicTransportDetails {
  railwayBillNumber: string,
}

export interface Plane extends BasicTransportDetails {
  flightNumber: string,
  containerNumber: string
}

export interface ContainerVessel extends BasicTransportDetails {
  vesselName: string,
  flagState: string,
  containerNumber: string
}

export interface Truck extends BasicTransportDetails {
  cmr?: boolean,
  nationalityOfVehicle?: string,
  registrationNumber?: string
}

type FishingVessel = BasicTransportDetails;

export type Transport = Train | Plane | ContainerVessel | Truck | FishingVessel;

export interface CatchCertModel extends Document, CatchCertificate {}

// Schema
export const AuditSchema = new Schema({
  operation:  { type: String, required: true },
  at:         { type: Date, required: true }
}, { _id : false });

export const Country = new Schema({
  officialCountryName:  { type: String, required: true },
  isoCodeAlpha2:        { type: String, required: false },
  isoCodeAlpha3:        { type: String, required: false },
  isoNumericCode:       { type: String, required: false }
}, { _id: false });

export const TransportSchema = new Schema({
  exportedFrom:         { type: String },
  exportedTo:           { type: Country, required: false },
  vehicle:              { type: String,  required: false },
  departurePlace:       { type: String,  required: false },
  cmr:                  { type: Boolean, required: false },
  nationalityOfVehicle: { type: String,  required: false },
  registrationNumber:   { type: String,  required: false },
  railwayBillNumber:    { type: String,  required: false },
  flightNumber:         { type: String,  required: false },
  vesselName:           { type: String,  required: false },
  flagState:           { type: String,  required: false },
  containerNumber:      { type: String,  required: false },
  exportDate:           { type: String,  required: false }
}, { _id : false });

const PresentationSchema = new Schema({
  code:  { type: String, required: true },
  name:  { type: String },
  admin: { type: String }
}, { _id : false } );

const StateSchema = new Schema({
  code:  { type: String, required: true },
  name:  { type: String },
  admin: { type: String }
}, { _id : false } );

const CatchSchema = new Schema({
  vessel:                   { type: String, required: true  },
  pln:                      { type: String, required: true  },
  homePort:                 { type: String, required: false },
  flag:                     { type: String, required: false },
  cfr:                      { type: String, required: false },
  imoNumber:                { type: String, required: false },
  licenceNumber:            { type: String, required: false },
  licenceValidTo:           { type: String, required: false },
  licenceHolder:            { type: String, required: false },
  id:                       { type: String, required: true  },
  date:                     { type: String, required: true  },
  faoArea:                  { type: String, required: false },
  weight:                   { type: Number, required: true },
  numberOfSubmissions:      { type: Number, required: true, default: 0 },
  vesselOverriddenByAdmin:  { type: Boolean,required: false },
  vesselNotFound:           { type: Boolean,required: false },
  _status:                  { type: String, required: false, enum: Object.values(LandingStatuses) },
  dataEverExpected:         { type: Boolean,required: false },
  landingDataExpectedDate:  { type: String, required: false },
  landingDataEndDate:       { type: String, required: false },
  isLegallyDue:             { type: Boolean,required: false },
  vesselRiskScore:          { type: Number, required: false },
  exporterRiskScore:        { type: Number, required: false },
  speciesRiskScore:         { type: Number, required: false },
  threshold:                { type: Number, required: false },
  riskScore:                { type: Number, required: false },
  isSpeciesRiskEnabled:    { type: Boolean, required: false }
}, { _id : false } );

const ProductSchema = new Schema({
  speciesId:                { type: String, required: true },
  species:                  { type: String, required: false },
  speciesAdmin:             { type: String, required: false },
  speciesCode:              { type: String, required: false },
  commodityCode:            { type: String, required: false },
  commodityCodeAdmin:       { type: String, required: false },
  commodityCodeDescription: { type: String, required: false },
  scientificName:           { type: String, required: false },
  state:                    { type: StateSchema,       required: false },
  presentation:             { type: PresentationSchema,required: false },
  factor:                   { type: Number, required: false },
  caughtBy:                 { type: [CatchSchema],     require: false }
}, { _id : false } );

// schema for model
export const ExporterDetailsSchema = new Schema({
  contactId:            { type: String, required: false  },
  accountId:            { type: String },
  addressOne:           { type: String },
  buildingNumber:       { type: String },
  subBuildingName:      { type: String },
  buildingName:         { type: String },
  streetName:           { type: String },
  county:               { type: String },
  country:              { type: String },
  postcode:             { type: String },
  townCity:             { type: String , required: false },
  addressTwo:           { type: String , required: false },
  exporterCompanyName:  { type: String },
  exporterFullName:     { type: String },
  _dynamicsAddress:     { type: Object },
  _dynamicsUser:        { type: Object },
  _updated:             { type: Boolean, required: false }
}, { _id : false } );

const ConservationSchema = new Schema({
  conservationReference: { type: String, required: true }
}, { _id : false } );

const ExportDataSchema = new Schema({
  products:         { type: [ProductSchema],       required: true  },
  transportation:   { type: TransportSchema,       required: false },
  conservation:     { type: ConservationSchema,    required: false },
  exporterDetails:  { type: ExporterDetailsSchema, required: false },
  landingsEntryOption: { type: String, required: false, enum: Object.values(LandingsEntryOptions) }
}, { _id : false } );

const DocumentSchema = new Schema({
  __t:                { type: String, required: true  },
  documentNumber:     { type: String, required: true  },
  status:             { type: String, required: false, enum: Object.values(DocumentStatuses) },
  createdAt:          { type: Date,   required: true  },
  createdBy:          { type: String, required: true  },
  createdByEmail:     { type: String },
  documentUri:        { type: String, required: false },
  audit:              { type: Array,  required: false },
  investigation:      { type: Schema.Types.Mixed, required: false },
  exportData:         { type: ExportDataSchema,   required: false },
  requestByAdmin:     { type: Boolean,required: false },
  clonedFrom:         { type: String, required: false },
  landingsCloned:     { type: Boolean,required: false },
  parentDocumentVoid: { type: Boolean,required: false },
},
{strict: false}
)

export const CatchCertificateModel = model<CatchCertModel>('exportCertificate', DocumentSchema, 'exportCertificates');