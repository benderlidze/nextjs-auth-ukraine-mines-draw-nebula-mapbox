interface PolygonDataProps {
  polygonData: PolygonData | null;
}

export interface PolygonData {
  hazard_type_id: number;
  status_id: number;
}

export const PolygonInfoBox = ({ polygonData }: PolygonDataProps) => {
  return <div></div>;
};
