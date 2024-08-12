import * as SUT from "../../../src/landings/query/isValidationOveruse";
import * as risking from "../../../src/data/risking";
import moment from "moment";
import { ICcQueryResult, InvestigationStatus } from "mmo-shared-reference-data";

describe('when calculating a landing over use', () => {
  const queryTime = moment.utc();
  
  let mockIsHighRisk: jest.SpyInstance;

  beforeEach(() => {
    mockIsHighRisk = jest.spyOn(risking, "isHighRisk");
    mockIsHighRisk.mockReturnValue(true);
  })

  afterEach(() => {
    mockIsHighRisk.mockRestore();
  })

  it('will return true for an overuse across multiple certificates', () => {
    const landing: ICcQueryResult = {
      documentNumber: 'CC1',
      documentType: 'catchCertificate',
      createdAt: moment.utc('2020-01-01T08:26:06.939Z').toISOString(),
      status: 'COMPLETE',
      rssNumber: 'rssWA1',
      da: 'Guernsey',
      dateLanded: '2020-01-01',
      species: 'COD',
      weightOnCert: 100,
      rawWeightOnCert: 100,
      weightOnAllCerts: 250,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 100,
      weightFactor: 1,
      isLandingExists: true,
      isSpeciesExists: true,
      numberOfLandingsOnDay: 1,
      weightOnLanding: 100,
      weightOnLandingAllSpecies: 1,
      isOverusedThisCert: false,
      isOverusedAllCerts: true,
      isExceeding14DayLimit: true,
      overUsedInfo: ["CC2", "CC3"],
      durationSinceCertCreation: moment.duration(
        queryTime
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      extended: {
        landingId: 'rssWA12019-07-10',
        exporterName: 'Mr Bob',
        exporterPostCode: 'AB1 2XX',
        documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
        presentation: 'SLC',
        presentationAdmin: 'sliced admin',
        presentationName: 'sliced',
        vessel: 'DAYBREAK',
        licenceHolder: 'MASTER OF VESSEL',
        fao: 'FAO27',
        pln: 'WA1',
        species: 'Lobster',
        speciesAdmin: 'Lobster Admin',
        scientificName: "Gadus morhua",
        state: 'FRE',
        stateAdmin: 'fresh admin',
        stateName: 'fresh',
        commodityCode: '1234',
        commodityCodeAdmin: '1234 - ADMIN',
        commodityCodeDescription: "Fresh or chilled fillets of cod",
        investigation: {
          investigator: "Investigator Gadget",
          status: InvestigationStatus.Open
        },
        transportationVehicle: 'directLanding',
        numberOfSubmissions: 1,
        dataEverExpected: true,
        landingDataExpectedDate: "2019-07-10",
        landingDataEndDate: "2019-07-12"
      }
    }

    expect(SUT.isValidationOveruse(landing)).toBe(true);
  });

  it('will return false for an overuse across a certificate', () => {
    const landing: ICcQueryResult = {
      documentNumber: 'CC1',
      documentType: 'catchCertificate',
      createdAt: moment.utc('2020-01-01T08:26:06.939Z').toISOString(),
      status: 'COMPLETE',
      rssNumber: 'rssWA1',
      da: 'Guernsey',
      dateLanded: '2020-01-01',
      species: 'COD',
      weightOnCert: 100,
      rawWeightOnCert: 100,
      weightOnAllCerts: 250,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 100,
      weightFactor: 1,
      isLandingExists: true,
      isSpeciesExists: true,
      numberOfLandingsOnDay: 1,
      weightOnLanding: 100,
      weightOnLandingAllSpecies: 1,
      isOverusedThisCert: true,
      isOverusedAllCerts: false,
      isExceeding14DayLimit: true,
      overUsedInfo: ["CC2", "CC3"],
      durationSinceCertCreation: moment.duration(
        queryTime
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      extended: {
        landingId: 'rssWA12019-07-10',
        exporterName: 'Mr Bob',
        exporterPostCode: 'AB1 2XX',
        documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
        presentation: 'SLC',
        presentationAdmin: 'sliced admin',
        presentationName: 'sliced',
        vessel: 'DAYBREAK',
        licenceHolder: 'MASTER OF VESSEL',
        fao: 'FAO27',
        pln: 'WA1',
        species: 'Lobster',
        speciesAdmin: 'Lobster Admin',
        scientificName: "Gadus morhua",
        state: 'FRE',
        stateAdmin: 'fresh admin',
        stateName: 'fresh',
        commodityCode: '1234',
        commodityCodeAdmin: '1234 - ADMIN',
        commodityCodeDescription: "Fresh or chilled fillets of cod",
        investigation: {
          investigator: "Investigator Gadget",
          status: InvestigationStatus.Open
        },
        transportationVehicle: 'directLanding',
        numberOfSubmissions: 1,
        dataEverExpected: true,
        landingDataExpectedDate: "2019-07-10",
        landingDataEndDate: "2019-07-12"
      }
    }

    expect(SUT.isValidationOveruse(landing)).toBe(false);
  });

  it('will return false for a low risk landing with an overuse across multiple certificates', () => {
    mockIsHighRisk.mockReturnValue(false);

    const landing: ICcQueryResult = {
      documentNumber: 'CC1',
      documentType: 'catchCertificate',
      createdAt: moment.utc('2020-01-01T08:26:06.939Z').toISOString(),
      status: 'COMPLETE',
      rssNumber: 'rssWA1',
      da: 'Guernsey',
      dateLanded: '2020-01-01',
      species: 'COD',
      weightOnCert: 100,
      rawWeightOnCert: 100,
      weightOnAllCerts: 250,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 100,
      weightFactor: 1,
      isLandingExists: true,
      isSpeciesExists: true,
      numberOfLandingsOnDay: 1,
      weightOnLanding: 100,
      weightOnLandingAllSpecies: 1,
      isOverusedThisCert: false,
      isOverusedAllCerts: true,
      isExceeding14DayLimit: true,
      overUsedInfo: ["CC2", "CC3"],
      durationSinceCertCreation: moment.duration(
        queryTime
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      extended: {
        landingId: 'rssWA12019-07-10',
        exporterName: 'Mr Bob',
        exporterPostCode: 'AB1 2XX',
        documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
        presentation: 'SLC',
        presentationAdmin: 'sliced admin',
        presentationName: 'sliced',
        vessel: 'DAYBREAK',
        licenceHolder: 'MASTER OF VESSEL',
        fao: 'FAO27',
        pln: 'WA1',
        species: 'Lobster',
        speciesAdmin: 'Lobster Admin',
        scientificName: "Gadus morhua",
        state: 'FRE',
        stateAdmin: 'fresh admin',
        stateName: 'fresh',
        commodityCode: '1234',
        commodityCodeAdmin: '1234 - ADMIN',
        commodityCodeDescription: "Fresh or chilled fillets of cod",
        investigation: {
          investigator: "Investigator Gadget",
          status: InvestigationStatus.Open
        },
        transportationVehicle: 'directLanding',
        numberOfSubmissions: 1,
        dataEverExpected: true,
        landingDataExpectedDate: "2019-07-10",
        landingDataEndDate: "2019-07-12"
      }
    }

    expect(SUT.isValidationOveruse(landing)).toBe(false);
  });

  it('will return false for a pre-approved landing with an overuse across multiple certificates', () => {
    const landing: ICcQueryResult = {
      documentNumber: 'CC1',
      documentType: 'catchCertificate',
      createdAt: moment.utc('2020-01-01T08:26:06.939Z').toISOString(),
      status: 'COMPLETE',
      rssNumber: 'rssWA1',
      da: 'Guernsey',
      dateLanded: '2020-01-01',
      species: 'COD',
      weightOnCert: 100,
      rawWeightOnCert: 100,
      weightOnAllCerts: 250,
      weightOnAllCertsBefore: 0,
      weightOnAllCertsAfter: 100,
      weightFactor: 1,
      isLandingExists: true,
      isSpeciesExists: true,
      numberOfLandingsOnDay: 1,
      weightOnLanding: 100,
      weightOnLandingAllSpecies: 1,
      isOverusedThisCert: false,
      isOverusedAllCerts: true,
      isExceeding14DayLimit: true,
      overUsedInfo: ["CC2", "CC3"],
      isPreApproved: true,
      durationSinceCertCreation: moment.duration(
        queryTime
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndFirstLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      durationBetweenCertCreationAndLastLandingRetrieved: moment.duration(
        moment.utc('2019-07-11T09:00:00.000Z')
          .diff(moment.utc('2019-07-13T08:26:06.939Z'))).toISOString(),
      extended: {
        landingId: 'rssWA12019-07-10',
        exporterName: 'Mr Bob',
        exporterPostCode: 'AB1 2XX',
        documentUrl: '_887ce0e0-9ab1-4f4d-9524-572a9762e021.pdf',
        presentation: 'SLC',
        presentationAdmin: 'sliced admin',
        presentationName: 'sliced',
        vessel: 'DAYBREAK',
        licenceHolder: 'MASTER OF VESSEL',
        fao: 'FAO27',
        pln: 'WA1',
        species: 'Lobster',
        speciesAdmin: 'Lobster Admin',
        scientificName: "Gadus morhua",
        state: 'FRE',
        stateAdmin: 'fresh admin',
        stateName: 'fresh',
        commodityCode: '1234',
        commodityCodeAdmin: '1234 - ADMIN',
        commodityCodeDescription: "Fresh or chilled fillets of cod",
        investigation: {
          investigator: "Investigator Gadget",
          status: InvestigationStatus.Open
        },
        transportationVehicle: 'directLanding',
        numberOfSubmissions: 1,
        dataEverExpected: true,
        landingDataExpectedDate: "2019-07-10",
        landingDataEndDate: "2019-07-12"
      }
    }

    expect(SUT.isValidationOveruse(landing)).toBe(false);
  });
});