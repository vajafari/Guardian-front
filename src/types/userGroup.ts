/** AccessTypeEnumeration: Admin, OnlySelf, AllBuildings, SomeBuildingsAndPersons. */
export type AccessType = 1 | 2 | 3 | 4;

/** Row shape from GET /api/core/UserGroup/GetAll. */
export interface UserGroup {
  id: string;
  title: string;
  accessType: AccessType;
  maxConcurrentSessions: number;
  cidrPrefix: string | null;
  cidrPrefixLength: number | null;
  userCount: number;
}

/** GET /api/core/UserGroup/GetById response, with relations loaded. */
export interface UserGroupFullInfo extends UserGroup {
  userGroupBuildings: { buildingId: string }[];
  userGroupPersons: { personId: string }[];
  userGroupLocations: { locationId: string }[];
  userGroupContractors: { contractorId: string }[];
}

/** POST /api/core/UserGroup/Add and /Save body. */
export interface UserGroupPayload {
  id: string;
  title: string;
  accessType: AccessType;
  maxConcurrentSessions: number;
  cidrPrefix: string | null;
  cidrPrefixLength: number | null;
  userGroupBuildings: { userGroupId: string; buildingId: string }[];
  userGroupPersons: { userGroupId: string; personId: string }[];
  userGroupLocations: { userGroupId: string; locationId: string }[];
  userGroupContractors: { userGroupId: string; contractorId: string }[];
  userGroupMenus: [];
  userGroupAccesses: [];
}

export type UserGroupErrorCode =
  | 'missing-fields'
  | 'title-invalid'
  | 'max-sessions-invalid'
  | 'cidr-invalid'
  | 'network-error'
  | 'unknown';

export class UserGroupError extends Error {
  code: UserGroupErrorCode;

  constructor(code: UserGroupErrorCode) {
    super(code);
    this.code = code;
    this.name = 'UserGroupError';
  }
}
