import { httpClient } from './httpClient';
import { ELEVATOR_FLOOR_PERSON_ENDPOINTS } from './config';
import type { ElevatorFloorPersonFullInfo } from '../types/elevatorFloorPerson';

/** Persons currently granted access to one ElevatorFloor — to pre-populate the assignment dialog. */
export async function searchPersonsOfElevatorFloor(elevatorFloorId: string): Promise<ElevatorFloorPersonFullInfo[]> {
  const { data } = await httpClient.post<ElevatorFloorPersonFullInfo[]>(ELEVATOR_FLOOR_PERSON_ENDPOINTS.searchFullInfo, {
    filter: { elevatorFloorIds: [elevatorFloorId] },
  });
  return data;
}
