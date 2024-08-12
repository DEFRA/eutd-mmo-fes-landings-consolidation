import { IConsolidateLandingItem } from "../../../src/types";
import * as SUT from "../../../src/landings/query/isOveruseAllCerts";

describe('when calculating a landing over use', () => {
  let mockCurrentTime: jest.SpyInstance;

  beforeEach(() => {
    mockCurrentTime = jest.spyOn(Date, 'now').mockImplementation(() => 1697112000000); // 2023-10-1212:00:00.000Z
  });

  afterEach(() => {
    mockCurrentTime.mockRestore();
  });

  it('will return false if a landing consolidate item is not provided', () => {
    const isOverusedAllCerts = SUT.isOverusedAllCerts(undefined);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a consolidation landing has no landings', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 0
    };

    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a consolidation landing has an empty landings array', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 0,
      landings: []
    };

    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a landing overuse does not occur', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 260,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 260,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };

    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a landing overuse occurs on one landing', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 260,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 260,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a landing overuse occurs on more than one landing on the same certificate', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 400,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC1-2",
        documentNumber: "CC1",
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a landing overuse occurs within the 50 KG tolerance plus 10% on more than one estimate landing on across more than one certificate', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: true,
      exportWeight: 160,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 80,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 80,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a landing overuse occurs within the 50 KG tolerance on more than one landing on across more than one certificate', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 150,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a landing overuse occurs over the 50 KG tolerance on more than one landing on across more than one certificate where a preapproved document brings usgage within the landed weight', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 151,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        isPreApproved: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a landing overuse occurs over the 50 KG tolerance on more than one landing on across more than one certificate and all landings are low risk', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 151,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if a landing overuse occurs over the 50 KG tolerance on more than one landing on across more than one certificate and all landings are pre approved', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 151,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isPreApproved: true,
        isHighRisk: true
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isPreApproved: true
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if there is not an overuse across all non preapproved documents', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 151,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isPreApproved: true,
        isHighRisk: true
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if the landed weight is less than or equal to 0', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 0,
      isEstimate: true,
      exportWeight: 161,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 81,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 80,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isHighRisk: true
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return true if a landing overuse occurs over the 50 KG tolerance on more than one landing on across more than one certificate with a preapproval on one documnet', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 151,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isPreApproved: true,
        isHighRisk: true
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isHighRisk: true
      },{
        landingId: "CC3-1",
        documentNumber: "CC3",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isHighRisk: true
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(true);
  });

  it('will return false if a high risk landing within it\'s retrospective period does not exist', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 151,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13",
        isPreApproved: true,
        isHighRisk: true
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13",
        isHighRisk: true
      },{
        landingId: "CC3-1",
        documentNumber: "CC3",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13",
        isHighRisk: true
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return false if all high risk landings are without it\'s retrospective period', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 301,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13",
        isPreApproved: true,
        isHighRisk: true
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13",
        isHighRisk: true
      },{
        landingId: "CC3-1",
        documentNumber: "CC3",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13",
        isHighRisk: true
      },{
        landingId: "CC4-1",
        documentNumber: "CC4",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isHighRisk: false
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return true if at least one high risk landings are BEFORE retrospective period exists', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 301,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13",
        isPreApproved: true,
        isHighRisk: true
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13",
        isHighRisk: true
      },{
        landingId: "CC3-1",
        documentNumber: "CC3",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-13",
        landingDataEndDate: "2023-10-13",
        isHighRisk: true
      },{
        landingId: "CC4-1",
        documentNumber: "CC4",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isHighRisk: false
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(true);
  });

  it('will return false if a landing overuse occurs over the 50 KG tolerance on more than one landing on across more than one certificate where a preapproved document doesn\'t affect being over the landed weight', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 251,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        isPreApproved: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC3-1",
        documentNumber: "CC3",
        weight: 100,
        dataEverExpected: true,
        isPreApproved: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(false);
  });

  it('will return true if a landing overuse occurs over the 50 KG tolerance on more than one landing on across more than one certificate', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 151,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 76,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 75,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isHighRisk: true
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(true);
  });
  
  it('will return true if a landing overuse occurs above the 50 KG tolerance plus 10% on more than one estimate landing on across more than one certificate', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 100,
      isEstimate: true,
      exportWeight: 161,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 81,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 80,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13",
        isHighRisk: true
      }]
    };
    
    const isOverusedAllCerts = SUT.isOverusedAllCerts(landingConsolidationItem);
    expect(isOverusedAllCerts).toBe(true);
  });
});