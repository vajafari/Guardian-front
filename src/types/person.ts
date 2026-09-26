/** Row shape returned by GET /api/core/Person/SearchSummaryByFullName/{itemsPerPage}/{isActive}. */
export interface PersonSummary {
  id: string;
  personNumberOnDevice: number;
  firstName: string | null;
  lastName: string | null;
  nationalId: string | null;
  otherUniqueIdentificationCode: string | null;
}

/**
 * PersonTypeEnumeration — backend enum with 4 values (1-4), "ماهیت فرد"
 * ("nature of the person"). No labels are exposed anywhere in the OpenAPI
 * doc, so these are placeholder names until confirmed against the backend's
 * actual enum — update PERSON_TYPE_OPTIONS in PersonsPage once known.
 */
export type PersonType = 1 | 2 | 3 | 4;

/** POST /api/core/Person/Add and /api/core/Person/Update body. */
export interface PersonPayload {
  id: string;
  personType: PersonType;
  contractorContractId: string | null;
  personNumberOnDevice: number;
  firstName: string;
  lastName: string;
  nationalId: string | null;
  otherUniqueIdentificationCode: string | null;
  cellPhoneNumber: string | null;
  fixedTel: string | null;
  email: string | null;
  address: string | null;
  fatherName: string | null;
  startDate: string;
  endDate: string | null;
  birthday: string | null;
  emergencyContacts: string | null;
  additionalDescription: string | null;
  isActive: boolean;
  fieldOfStudyId: string | null;
  positionId: string | null;
  inactiveDescription: string | null;
  description: string | null;
  locationIds: string[] | null;
  personGroupIds: string[] | null;
  hasImage: boolean;
  imagePath: string | null;
  isImageChanged: boolean;
}

/** GET /api/core/Person/GetById response (fields we display; nested collections are not requested). */
export interface PersonFullInfo {
  id: string;
  personType: PersonType;
  contractorContractId: string | null;
  personNumberOnDevice: number;
  firstName: string | null;
  lastName: string | null;
  nationalId: string | null;
  otherUniqueIdentificationCode: string | null;
  cellPhoneNumber: string | null;
  fixedTel: string | null;
  email: string | null;
  address: string | null;
  fatherName: string | null;
  startDate: string;
  endDate: string | null;
  birthday: string | null;
  emergencyContacts: string | null;
  additionalDescription: string | null;
  isActive: boolean;
  fieldOfStudyId: string | null;
  positionId: string | null;
  inactiveDescription: string | null;
  description: string | null;
  fieldOfStudyTitle: string | null;
  positionTitle: string | null;
}

export type PersonErrorCode = 'missing-fields' | 'network-error' | 'unknown';

export class PersonError extends Error {
  code: PersonErrorCode;

  constructor(code: PersonErrorCode) {
    super(code);
    this.code = code;
    this.name = 'PersonError';
  }
}
