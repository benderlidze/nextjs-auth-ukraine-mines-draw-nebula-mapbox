"use client";
import * as React from "react";
import Map, {
  GeolocateControl,
  NavigationControl,
  ScaleControl,
  Popup,
  Source,
  Layer,
  MapLayerMouseEvent,
  MapRef,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapboxLayers } from "@/components/MapboxLayers";
import type { FeatureCollection, Feature, GeoJSON } from "geojson";
import { useState, useCallback, useRef, useEffect } from "react";
import bbox from "@turf/bbox";
import { DrawControl } from "@/components/DrawControl";
import { DrawFeature, DrawPolygon } from "mapbox__mapbox-gl-draw";
import { SaveDataContainer } from "@/components/SaveData";
export interface HoverInfoProps {
  longitude: number;
  latitude: number;
  countyName: string;
}

export interface GeometryCollectionProps {
  [key: string]: Feature;
}

export const MapContainer = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [features, setFeatures] = useState<GeometryCollectionProps>({});
  const [drawMode, setDrawMode] = useState<string>("simple_select");

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

    // if (drawMode === "draw_polygon") return;

    // zoom to region
    // if (props && geojsonData) {
    //   if (!mapRef.current) return;
    //   const zoom = mapRef.current.getZoom();
    //   if (zoom > 7) return;

    //   const countyPolygon = geojsonData.features.find(
    //     (d) => d.properties && d.properties.shapeName === props.shapeName
    //   ) as Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

    //   const [minLng, minLat, maxLng, maxLat] = bbox(countyPolygon);

    //   mapRef.current &&
    //     mapRef.current.fitBounds(
    //       [
    //         [minLng, minLat],
    //         [maxLng, maxLat],
    //       ],
    //       { padding: 40, duration: 1000 }
    //     );
    // }
  };

  useEffect(() => {
    fetch("/geojson/geoBoundaries-UKR-ADM1.geojson")
      .then((res) => res.json())
      .then((data) => {
        setGeojsonData(data);
      });
  }, []);

  useEffect(() => {
    console.log("features", features);
  }, [features]);

  useEffect(() => {
    console.log("drawMode", drawMode);
  }, [drawMode]);

  const onUpdate = useCallback((e: MapboxDraw.DrawUpdateEvent) => {
    console.log("e", e);
    setFeatures((currFeatures) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        f.id && (newFeatures[f.id] = f);
      }
      return newFeatures;
    });
  }, []);

  const onDelete = useCallback((e: MapboxDraw.DrawDeleteEvent) => {
    setFeatures((currFeatures) => {
      const newFeatures = { ...currFeatures };
      for (const f of e.features) {
        delete newFeatures[f.id as string];
      }
      return newFeatures;
    });
  }, []);

  const onModeChange = useCallback((e: MapboxDraw.DrawModeChangeEvent) => {
    const mode = e.mode;
    setDrawMode(mode);
  }, []);

  return (
    <div>
      <SaveDataContainer data={features} />

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
        <DrawControl
          position="top-right"
          displayControlsDefault={false}
          controls={{
            polygon: true,
            trash: true,
          }}
          defaultMode="simple_select"
          onCreate={onUpdate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onModeChange={onModeChange}
        />
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
