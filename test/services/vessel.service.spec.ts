import { IVessel, LandingSources } from 'mmo-shared-reference-data';
import * as Cache from '../../src/data/cache';
import { getPlnsForLanding, getRssNumber } from '../../src/services/vessel.service';
import { IConsolidateLanding, ILandingDetail } from '../../src/types';
import logger from '../../src/logger';

describe('vessel service - get plns for landings', () => {

  let mockGetVesselData: jest.SpyInstance;

  const vesselData: IVessel[] = [{
    fishingVesselName: 'MARLENA',
    ircs: null,
    flag: 'GBR',
    homePort: 'WESTRAY',
    registrationNumber: 'K529',
    imo: null,
    fishingLicenceNumber: '30117',
    fishingLicenceValidFrom: '2006-06-07T00:00:00',
    fishingLicenceValidTo: '2006-06-30T00:00:00',
    adminPort: 'STORNOWAY',
    rssNumber: 'A12032',
    vesselLength: 8.84,
    cfr: 'GBRA12032',
    licenceHolderName: "I am the Licence Holder name for this fishing boat"
  },
  {
    fishingVesselName: "WIRON 5",
    ircs: "2HGD8",
    cfr: "NLD200202641",
    flag: "GBR",
    homePort: "PLYMOUTH",
    registrationNumber: "H1100",
    imo: 9249556,
    fishingLicenceNumber: "12480",
    fishingLicenceValidFrom: "2021-08-10T00:00:00",
    fishingLicenceValidTo: "2030-12-31T00:00:00",
    adminPort: "PLYMOUTH",
    rssNumber: "C20514",
    vesselLength: 50.63,
    licenceHolderName: "INTERFISH WIRONS LIMITED"
  },
  {
    fishingVesselName: "ATLANTA II",
    ircs: "MJAU2",
    cfr: "GBR000A21401",
    flag: "GBR",
    homePort: "MILFORD HAVEN",
    registrationNumber: "M82",
    imo: null,
    fishingLicenceNumber: "11685",
    fishingLicenceValidFrom: "2016-05-03T00:00:00",
    fishingLicenceValidTo: "2030-12-31T00:00:00",
    adminPort: "MILFORD HAVEN",
    rssNumber: "A21401",
    vesselLength: 11.75,
    licenceHolderName: "MR  SIMON COLL"
  }];

  beforeEach(() => {
    mockGetVesselData = jest.spyOn(Cache, 'getVesselsData');
    mockGetVesselData.mockReturnValue(vesselData)
  });

  afterEach(() => {
    mockGetVesselData.mockRestore()
  });

  it('will return the vessel detail with pln', () => {
    const transformedLanding: IConsolidateLanding = {
      dateLanded: "2023-10-09",
      rssNumber: "A21401",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    };

    const vesselDetails: ILandingDetail | undefined = getPlnsForLanding(transformedLanding);
    expect(vesselDetails).toBeDefined();
    expect(vesselDetails?.pln).toBe('M82')
  })

  it('will return undefined if a licence can not be found', () => {
    const transformedLanding: IConsolidateLanding = {
      dateLanded: "2016-05-02",
      rssNumber: "A21401",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    };

    const vesselDetails: ILandingDetail | undefined = getPlnsForLanding(transformedLanding);
    expect(vesselDetails).toBeUndefined();
  });

});

describe("vessel service - get rssNumber", () => {

  let mockLogger: jest.SpyInstance;

  const vessels: IVessel[] = [
    {
      fishingVesselName: "vessel name",
      registrationNumber: "OB956",
      fishingLicenceValidTo: "2017-12-20T00:00:00",
      fishingLicenceValidFrom: "2012-05-02T00:00:00",
      rssNumber: "rssNumber",
      flag: "UK",
      homePort: "PLYMOUTH",
      fishingLicenceNumber: "FB1",
      imo: null,
      vesselLength: 10,
      adminPort: "PLYMOUTH"
    },
    {
      fishingVesselName: "vessel name",
      registrationNumber: "OB956",
      fishingLicenceValidTo: "2017-12-20T00:00:00",
      fishingLicenceValidFrom: "2012-05-02T00:00:00",
      rssNumber: "rssNumber2",
      flag: "UK",
      homePort: "PLYMOUTH",
      fishingLicenceNumber: "FB1",
      imo: null,
      vesselLength: 10,
      adminPort: "PLYMOUTH"
    }];

  beforeEach(() => {
    mockLogger = jest.spyOn(logger, 'error');
    Cache.updateVesselsCache(vessels);
  });

  afterEach(() => {
    mockLogger.mockRestore();
    Cache.updateVesselsCache([]);
  })

  it('will return undefined if date is wrong', () => {

    const output = getRssNumber("OB956", "tarara");

    expect(output).toEqual(undefined);
  })

  it('search by registrationNumber and date', () => {

    const output = getRssNumber("OB956", "2012-12-29");

    expect(output).toEqual("rssNumber");
  });

  it('should respect lower date boundaries', () => {

    const output = getRssNumber("OB956", "2012-05-02");

    expect(output).toEqual("rssNumber");
  });

  it('should respect upper date boundaries', () => {

    const output = getRssNumber("OB956", "2017-12-");

    expect(output).toEqual("rssNumber");
  });

  it('should only return the first occurrence', () => {

    const output = getRssNumber("OB956", "2012-08-02");

    expect(output).toEqual("rssNumber");
  });

  it('should return undefined if vessel does not exist', () => {
    const output = getRssNumber("OB956", "2020-12-02");

    expect(output).toEqual(undefined);
    expect(mockLogger).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][VESSEL-SERVICE][RSS-NUMBER][NOT-FOUND][OB956:2020-12-02]')
  });

  it('should return undefined if licence does not exist', () => {
    const output = getRssNumber("OB955", "2020-12-02");

    expect(output).toEqual(undefined);
    expect(mockLogger).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][VESSEL-SERVICE][VESSEL-LOOKUP][NOT-FOUND][OB955:2020-12-02]')
  });

  it('should do an exact search on pln and not pick up another pln that happens to start with the pln we are searching for', () => {

    const vessels: IVessel[] = [
      {
        fishingVesselName: "vessel name",
        registrationNumber: "BM132",
        fishingLicenceValidTo: "2017-12-20T00:00:00",
        fishingLicenceValidFrom: "2012-05-02T00:00:00",
        rssNumber: "BAD",
        flag: "UK",
        homePort: "PLYMOUTH",
        fishingLicenceNumber: "FB1",
        imo: null,
        vesselLength: 10,
        adminPort: "PLYMOUTH"
      },
      {
        fishingVesselName: "vessel name",
        registrationNumber: "BM1",
        fishingLicenceValidTo: "2017-12-20T00:00:00",
        fishingLicenceValidFrom: "2012-05-02T00:00:00",
        rssNumber: "GOOD",
        flag: "UK",
        homePort: "PLYMOUTH",
        fishingLicenceNumber: "FB1",
        imo: null,
        vesselLength: 10,
        adminPort: "PLYMOUTH"
      }];

    Cache.updateVesselsCache(vessels);

    const output = getRssNumber("BM1", "2015-12-02");

    expect(output).toBe('GOOD')

  })

});