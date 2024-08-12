import { LandingSources } from "mmo-shared-reference-data";
import { IConsolidateLandingItem } from "../../../src/types";
import * as SUT from "../../../src/landings/query/isWithinDeminimus";

describe('when calculating a landing is an Elog species failure', () => {
  const landedWeightBySpecies = null;

  let mockCurrentTime: jest.SpyInstance;

  beforeEach(() => {
    mockCurrentTime = jest.spyOn(Date, 'now').mockImplementation(() => 1697112000000); // 2023-10-1212:00:00.000Z
  });

  afterEach(() => {
    mockCurrentTime.mockRestore();
  });

  it('will return false for an undefined landing consolidate item and landing source', () => {
    expect(SUT.isWithinDeminimus(undefined, undefined, landedWeightBySpecies)).toBe(false);
  })

  it('will return false for an undefined landing consolidate item and source other than ELOG', () => {
    expect(SUT.isWithinDeminimus(undefined, LandingSources.CatchRecording, landedWeightBySpecies)).toBe(false);
  })

  it('will return false for an undefined landing consolidate item', () => {
    expect(SUT.isWithinDeminimus(undefined, LandingSources.ELog, landedWeightBySpecies)).toBe(false);
  })

  it('will return false for when consolidate landings is not withinDeminimus', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 51,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 51,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };

    expect(SUT.isWithinDeminimus(landingConsolidationItem, LandingSources.ELog, landedWeightBySpecies)).toBe(false);
  })

  it('will return false for when consolidate landings isWithinDeminimus but out retrospective period', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 50,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 50,
        dataEverExpected: true,
        landingDataExpectedDate: "2022-10-11",
        landingDataEndDate: "2022-10-13"
      }]
    };

    expect(SUT.isWithinDeminimus(landingConsolidationItem, LandingSources.ELog, landedWeightBySpecies)).toBe(false);
  })

  it('will return false for when consolidate landings isNotWithinDeminimus', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 50,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 50,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };

    expect(SUT.isWithinDeminimus(landingConsolidationItem, LandingSources.ELog, { weight: 50, source: LandingSources.ELog, isEstimate: true })).toBe(false);
  })

  it('will return true for when consolidate landings isNotWithinDeminimus BEFORE expected date', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 50,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 50,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-13",
        landingDataEndDate: "2023-10-13"
      }]
    };

    expect(SUT.isWithinDeminimus(landingConsolidationItem, LandingSources.ELog, { weight: 50, source: LandingSources.ELog, isEstimate: true })).toBe(false);
  })

  it('will return true for when consolidate landings isWithinDeminimus', () => {
    const landingConsolidationItem: IConsolidateLandingItem = {
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 50,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 50,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    };

    expect(SUT.isWithinDeminimus(landingConsolidationItem, LandingSources.ELog, landedWeightBySpecies)).toBe(true);
  })
})