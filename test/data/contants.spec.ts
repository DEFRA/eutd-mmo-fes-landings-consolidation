import { LandingSources } from "mmo-shared-reference-data";
import * as SUT from "../../src/data/constants";

describe('constants', () => {
  it('will return 50', () => {
    expect(SUT.TOLERANCE_IN_KG).toBe(50);
  })

  it('will return ELOG', () => {
    expect(SUT.getLandingSource("ELOG")).toBe(LandingSources.ELog);
  })

  it('will return CATCH_RECORDING', () => {
    expect(SUT.getLandingSource("CATCH_RECORDING")).toBe(LandingSources.CatchRecording);
  })

  it('will return LANDING_DECLARATION as default', () => {
    expect(SUT.getLandingSource("blah")).toBe(LandingSources.LandingDeclaration);
  })
});