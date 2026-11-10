/** Row shape from POST /api/core/ElevatorFloorPerson/SearchFullInfo. */
export interface ElevatorFloorPersonFullInfo {
  id: string;
  elevatorFloorId: string;
  personId: string;
  personNumberOnDevice: number;
  firstName: string | null;
  lastName: string | null;
  nationalId: string | null;
  actualFloorNumber: number;
  hardwareFloorNumber: number;
  elevatorId: string;
  elevatorTitle: string;
}
