"use client";
import * as React from "react";
import Map, {
  GeolocateControl,
  NavigationControl,
  ScaleControl,
  Popup,
  Source,
  Layer,
  MapMouseEvent,
  MapLayerMouseEvent,
  MapRef,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapboxLayers } from "@/components/MapboxLayers";
import type { FeatureCollection, Feature, GeoJSON } from "geojson";
import { useState, useCallback, useRef } from "react";
import bbox from "@turf/bbox";

import { Editor, DrawPolygonMode } from "react-map-gl-draw";

export interface HoverInfoProps {
  longitude: number;
  latitude: number;
  countyName: string;
}

export const MapContainer = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [hoverInfo, setHoverInfo] = useState<HoverInfoProps>({
    longitude: 0,
    latitude: 0,
    countyName: "",
  });
  const [geojsonData, setGeojsonData] = useState<
    FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>
  >({
    type: "FeatureCollection",
    features: [],
  });

  const onHover = useCallback((event: MapLayerMouseEvent) => {
    const props =
      event.features && event.features[0] && event.features[0].properties;
    const shapeName = props && props.shapeName;
    setHoverInfo({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
      countyName: shapeName,
    });
  }, []);

  const onClick = (event: MapLayerMouseEvent) => {
    const props =
      event.features && event.features[0] && event.features[0].properties;

    if (props && geojsonData) {
      const countyPolygon = geojsonData.features.find(
        (d) => d.properties && d.properties.shapeName === props.shapeName
      ) as Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

      // calculate the bounding box of the feature
      const [minLng, minLat, maxLng, maxLat] = bbox(countyPolygon);

      mapRef.current &&
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 40, duration: 1000 }
        );
    }
  };

  React.useEffect(() => {
    fetch("/geojson/geoBoundaries-UKR-ADM1.geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeojsonData(data);
      });
  }, []);

  return (
    <div>
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        initialViewState={{
          longitude: 31.171318441368896,
          latitude: 49.38952608677255,
          zoom: 5,
        }}
        style={{ width: "100vw", height: "80vh" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        projection={{ name: "mercator" } as mapboxgl.Projection}
        onMouseMove={onHover}
        onClick={onClick}
        interactiveLayerIds={["counties"]}
      >
       

        {geojsonData && (
          <MapboxLayers hoverInfo={hoverInfo} data={geojsonData} />
        )}
        <GeolocateControl position="top-left" />
        <NavigationControl position="top-left" />
        <ScaleControl />
      </Map>
    </div>
  );
};
