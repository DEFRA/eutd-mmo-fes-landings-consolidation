import { ILanding } from 'mmo-shared-reference-data';
import { Schema, model, Document } from 'mongoose';
import { ICatchCertificateLanding } from './consolidateLanding';

export interface ILandingDetail {
    dateLanded: string,
    rssNumber: string,
    pln?: string
}

export interface ILandingSpeciesIdx { [species: string]: ICatchCertificateLanding[] }

export interface ILandingModel extends ILanding, Document {}

const LandingItemSchema = new Schema({
    species:      { type: String, required: true },
    weight:       { type: Number, required: true },
    factor:       { type: Number, required: true },
    state:        { type: String, required: false },
    presentation: { type: String, required: false }
});

const LandingSchema = new Schema({
    rssNumber:         { type: String, required: false },
    dateTimeLanded:    { type: Date, required: true },
    dateTimeRetrieved: { type: Date, default: Date.now },
    source:            { type: String, required: true },
    items:             [ LandingItemSchema ]
});

export const LandingModel = model<ILandingModel>('Landing', LandingSchema);