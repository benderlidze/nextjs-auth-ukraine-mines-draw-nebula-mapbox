import type { FillLayer, LineLayer } from "react-map-gl";
import * as React from "react";
import { Popup, Source, Layer } from "react-map-gl";
import type { FeatureCollection, GeoJSON } from "geojson";
import { HoverInfoProps } from "@/components/MapboxMap";

export const countiesLayer: FillLayer = {
  id: "counties",
  type: "fill",
  source: "counties",
  paint: {
    "fill-outline-color": "rgba(0,0,0,0.1)",
    "fill-color": "rgba(0,0,0,0)",
  },
};
// Highlighted county polygons
export const highlightLayer: LineLayer = {
  id: "counties-highlighted",
  type: "line",
  source: "counties",
  paint: {
    "line-width": 2,
    "line-color": "#FF0000",
  },
};

interface ViewMapLayersProps {
  hoverInfo: HoverInfoProps;
  data: FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;
}

export const ViewMapLayers = ({ hoverInfo, data }: ViewMapLayersProps) => {
  const filter = React.useMemo(
    () => ["==", ["get", "shapeName"], hoverInfo.countyName || null],
    [hoverInfo]
  );
  return (
    <>
      <Source type="geojson" data={data}>
        <Layer {...countiesLayer} />
        <Layer {...highlightLayer} filter={filter} />
      </Source>
    </>
  );
};
