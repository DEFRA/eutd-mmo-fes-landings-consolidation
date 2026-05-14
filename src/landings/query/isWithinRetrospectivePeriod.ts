import moment from "moment";
import { ICatchCertificateLanding, ICatchCertificateSpecies } from "../../types";

export const isWithinRetrospectivePeriod: (landings: ICatchCertificateLanding[]) => boolean = (landings: ICatchCertificateLanding[]) =>
  Array.isArray(landings) && landings.some((landing: ICatchCertificateLanding) =>
    landing.dataEverExpected &&
    landing.landingDataExpectedDate &&
    landing.landingDataEndDate &&
    moment.utc().isBetween(moment.utc(landing.landingDataExpectedDate), moment.utc(landing.landingDataEndDate).add(1, 'day'), 'day', "[]")
  )

export const isRetrospectiveCheckRequired: (landing: ICatchCertificateLanding | ICatchCertificateSpecies) => boolean = (landing: ICatchCertificateLanding | ICatchCertificateSpecies) =>
  landing.dataEverExpected &&
  landing.landingDataEndDate &&
  moment.utc().isSameOrBefore(moment.utc(landing.landingDataEndDate).add(1, 'day'), 'day')