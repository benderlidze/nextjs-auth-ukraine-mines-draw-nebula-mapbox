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
    "fill-color": "rgba(0,0,0,0.1)",
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

interface MapboxLayersProps {
  hoverInfo: HoverInfoProps;
  data: FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;
}

export const MapboxLayers = ({ hoverInfo, data }: MapboxLayersProps) => {
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

// import { Source, Layer } from "react-map-gl";
// import type { FillLayer, LineLayer, SymbolLayer } from "react-map-gl";
// import {
//   Feature,
//   FeatureCollection,
//   Geometry,
//   GeoJsonProperties,
// } from "geojson";
// import type { FilterSpecification } from "@maplibre/maplibre-gl-style-spec";
// import { useMap } from "react-map-gl/dist/esm/components/use-map";
// import { LineProps } from "@components/EditProps";

// interface MapLayersProps {
//   data: FeatureCollection<Geometry, GeoJsonProperties>;
//   selectedLine: SelectedLineProps[];
//   selectedConnection: string[];
// }

// export interface SelectedConnectionProps {
//   conn_id: string;
// }
// export interface SelectedLineProps {
//   type: string;
//   id: string;
//   speed?: number;
//   name: string;
//   connections: Feature<Geometry, GeoJsonProperties>[];
// }

// const MapLayers = ({
//   data,
//   selectedLine,
//   selectedConnection,
// }: MapLayersProps) => {
//   const polygons: FillLayer = {
//     id: "polygons",
//     source: "outlines",
//     type: "fill",
//     paint: {
//       "fill-color": [
//         "case",
//         ["in", ["get", "lane_id"], ["literal", selectedLine.map((s) => s.id)]],
//         "blue",
//         ["==", ["get", "roadClosed"], true],
//         "red",
//         "black",
//       ],
//       "fill-opacity": 0.8,
//       "fill-outline-color": "white",
//     },
//     //filter where geometry is a polygon
//     filter: ["==", "$type", "Polygon"],
//   };

//   const connections: LineLayer = {
//     id: "connections",
//     source: "outlines",
//     type: "line",
//     paint: {
//       "line-width": [
//         "interpolate",
//         ["linear"],
//         ["zoom"],
//         10,
//         1,
//         15,
//         1,
//         16,
//         6,
//         17,
//         10,
//         18,
//         14,
//         19,
//         29,
//         19.5,
//         44,
//         20,
//         62,
//         20.5,
//         85,
//         21,
//         122,
//         21.5,
//         175,
//         22,
//         30,
//       ],
//       "line-color": [
//         "case",
//         [
//           "all",
//           ["==", ["get", "element"], "connection"],
//           ["==", ["get", "enabled"], true],
//         ],
//         "#4d4d4d",
//         "#1a1a1a", // default color
//       ],
//       "line-opacity": 0.7,
//     },
//     //filter where only ["get", "element"] === "connection"
//     filter: ["==", ["get", "element"], "connection"], // Display only features with "element" property equal to "connection"
//   };

//   const lineBorders: LineLayer = {
//     id: "lineBorders",
//     source: "outlines",
//     type: "line",
//     paint: {
//       "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1],
//       "line-color": "white",
//       "line-opacity": 1,
//     },
//     filter: ["==", ["get", "line_type"], "labe_borders"], //labe_borders misspell
//   };

//   const connectionsFlow: LineLayer = {
//     id: "connectionsFlow",
//     source: "outlines",
//     type: "line",
//     paint: {
//       "line-width": ["interpolate", ["linear"], ["zoom"], 10, 5],
//       "line-color": [
//         "case",
//         [
//           "all",
//           ["==", ["get", "element"], "connection"],
//           ["==", ["get", "enabled"], true],
//         ],
//         "#ccc",
//         "#1a1a1a", // default color
//       ],
//       "line-opacity": 0.7,
//     },
//     filter: ["==", ["get", "element"], "connection"], // Display only features with "element" property equal to "connection"
//   };

//   const connectionArrowLayer: SymbolLayer = {
//     id: "connectionArrowLayer",
//     source: "outlines",
//     type: "symbol",
//     minzoom: 15,
//     layout: {
//       "icon-image": "arrow-icon",
//       "symbol-placement": "line",
//       "symbol-spacing": 60,
//       "icon-allow-overlap": true,
//       "icon-size": [
//         "case",
//         [
//           "in",
//           ["get", "from_lane"],
//           ["literal", selectedLine.map((s) => s.id)],
//         ],
//         1,
//         0,
//       ],
//     },
//     filter: ["==", ["get", "element"], "connection"],
//   };

//   const roadArrowLayer: SymbolLayer = {
//     id: "roadArrowLayer",
//     source: "outlines",
//     type: "symbol",
//     minzoom: 15,
//     layout: {
//       "icon-image": "arrow-icon",

//       "symbol-placement": "line-center",
//       "symbol-spacing": 200,
//       "icon-allow-overlap": true,
//       "icon-size": 0.7,
//     },
//     //filter: ["==", "$type", "LineString"],
//     filter: ["==", ["get", "line_type"], "center_line"],
//   };

//   // // Highlighted
//   // const highlightLineLayer: LineLayer = {
//   //   id: "counties-highlighted",
//   //   type: "line",
//   //   source: "outlines",
//   //   paint: {
//   //     "line-width": 6,
//   //     "line-color": "#FF0000",
//   //   },
//   // };

//   const turns: LineLayer = {
//     id: "turns",
//     type: "line",
//     source: "outlines",
//     paint: {
//       "line-width": 8,
//       "line-color": [
//         "case",
//         [
//           "all",
//           [
//             "in",
//             ["get", "from_lane"],
//             ["literal", selectedLine.map((s) => s.id)],
//           ],
//           ["==", ["get", "status"], "active"],
//         ],
//         "#0000ff", //active connections
//         "#ccc", // all available connections
//       ],
//       "line-opacity": [
//         "case",
//         [
//           "in",
//           ["get", "from_lane"],
//           ["literal", selectedLine.map((s) => s.id)],
//         ],
//         1,
//         0, //hide all lines and show only selected
//         // 0.2,
//       ],
//     },
//     filter: ["==", ["get", "element"], "connection"],
//   };

//   const selectedTurn: LineLayer = {
//     id: "selectedTurn",
//     type: "line",
//     source: "outlines",
//     paint: {
//       "line-width": 8,
//       "line-color": "red",
//     },
//     filter: [
//       "all",
//       ["==", ["get", "element"], "connection"],
//       ["in", ["get", "conn_id"], ["literal", selectedConnection]],
//     ],
//   };

//   const intersectionsBox: FillLayer = {
//     id: "intersectionsBox",
//     type: "fill",
//     source: "outlines",
//     paint: {
//       "fill-color": "gray",
//       "fill-opacity": 0.5,
//     },
//     filter: [
//       "in",
//       ["get", "type"],
//       [
//         "literal",
//         ["priority", "right_before_left", "traffic_light", "dead_end"],
//       ],
//     ],
//   };

//   return (
//     <>
//       <Source type="geojson" data={data}>
//         <Layer {...polygons} />

//         <Layer {...intersectionsBox} />
//         {/* <Layer {...connections} /> */}
//         {/* <Layer {...connectionsFlow} /> */}

//         <Layer {...turns} />
//         <Layer {...selectedTurn} />
//         <Layer {...connectionArrowLayer} />

//         <Layer {...roadArrowLayer} />
//         <Layer {...lineBorders} />
//       </Source>
//     </>
//   );
// };

// export default MapLayers;
