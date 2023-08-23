import {
  HazardType,
  StatusType,
  UpdatePolygonData,
} from "@/components/MapboxGL";
import { useState } from "react";

interface PolygonDataProps {
  polygonData: PolygonData | null;
  hazardTypes: HazardType[];
  statusTypes: StatusType[];
  updatePolygonData: (polygonData: UpdatePolygonData) => void;
}

export interface PolygonData {
  id: number;
  hazard_type_id: number;
  status_id: number;
  description: string;
}

export const PolygonInfoBox = ({
  polygonData,
  hazardTypes,
  statusTypes,
  updatePolygonData,
}: PolygonDataProps) => {
  console.log("polygonData", polygonData);
  console.log("hazardTypes", hazardTypes);

  return (
    <div>
      <h1>Polygon Info</h1>
      <div className="mt-4">Description:</div>
      <textarea
        className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        name="description"
        id="description"
        value={polygonData?.description || ""}
        onInput={(e) => {
          const description = e.target.value;
          updatePolygonData({
            polygonId: polygonData?.id,
            polygonPropName: "description",
            value: description,
          });
        }}
      />
      <div className="mt-4">Hazard Type:</div>
      <select
        className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        name="hazard_type"
        id="hazard_type"
        value={polygonData?.hazard_type_id || 0}
        onChange={(e) => {
          const hazardTypeId = parseInt(e.target.value);
          updatePolygonData({
            polygonId: polygonData?.id,
            polygonPropName: "hazard_type_id",
            value: hazardTypeId,
          });
        }}
      >
        <option key={0} value={0}>
          Select a hazard type
        </option>
        {hazardTypes.map((hazardType) => (
          <option key={hazardType.id} value={hazardType.id}>
            {hazardType.name}
          </option>
        ))}
      </select>
      <div className="mt-4">Status:</div>
      <select
        className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
        name="status_type"
        id="status_type"
        value={polygonData?.status_id || 0}
        onChange={(e) => {
          const statusId = parseInt(e.target.value);
          updatePolygonData({
            polygonId: polygonData?.id,
            polygonPropName: "status_id",
            value: statusId,
          });
        }}
      >
        <option key={0} value={0}>
          Select a status type
        </option>
        {statusTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
    </div>
  );
};
