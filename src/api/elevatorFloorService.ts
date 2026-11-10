import { httpClient } from './httpClient';
import { ELEVATOR_FLOOR_ENDPOINTS } from './config';
import type { ElevatorFloorFullInfo } from '../types/elevator';

/** Floors of one elevator, with PersonCount/titles — for the detail page's floor table. */
export async function searchElevatorFloorsByElevator(elevatorId: string): Promise<ElevatorFloorFullInfo[]> {
  const { data } = await httpClient.post<ElevatorFloorFullInfo[]>(ELEVATOR_FLOOR_ENDPOINTS.searchFullInfo, {
    filter: { elevatorIds: [elevatorId] },
  });
  return data;
}
