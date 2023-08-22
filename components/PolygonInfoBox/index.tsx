import { HazardType, UpdatePolygonData } from "@/components/MapboxGL";
import { useState } from "react";

interface PolygonDataProps {
  polygonData: PolygonData | null;
  hazardTypes: HazardType[];
  updatePolygonData: (polygonData: UpdatePolygonData) => void;
}

export interface PolygonData {
  hazard_type_id: number;
  status_id: number;
}

export const PolygonInfoBox = ({
  polygonData,
  hazardTypes,
  updatePolygonData,
}: PolygonDataProps) => {
  console.log("polygonData", polygonData);
  console.log("hazardTypes", hazardTypes);

  return (
    <div>
      <h1>Polygon Info</h1>
      <p>Hazard Type: {polygonData?.hazard_type_id}</p>
      <select
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

      <p>Status: {polygonData?.status_id}</p>
    </div>
  );
};
