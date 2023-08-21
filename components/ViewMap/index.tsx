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
import { ViewMapLayers } from "@/components/ViewMapLayers";

export interface HoverInfoProps {
  longitude: number;
  latitude: number;
  countyName: string;
}

export interface GeometryCollectionProps {
  [key: string]: Feature;
}

export const ViewMap = () => {
  const mapRef = useRef<MapRef | null>(null);
  const drawRef = useRef<MapboxDraw>(null);
  const [savedGeometry, setSavedGeometry] = useState<GeometryCollectionProps>(
    {}
  );
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
  };

  const fetchAllData = async () => {
    const resp = await fetch("/api/load-all-data", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const dataFromDB = await resp.json();

    if (dataFromDB && dataFromDB.length > 0) {
      const geometry = dataFromDB.map((d: any) => {
        return {
          ...d,
          properties: JSON.parse(d.properties),
        };
      });
      console.log("geometry========>", geometry);
      //   setSavedGeometry(geometry);

      const FeatureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: geometry.map((g: GeometryCollectionProps) => g.properties),
      };

      setGeojsonData(FeatureCollection);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  //   useEffect(() => {
  //     fetch("/geojson/geoBoundaries-UKR-ADM1.geojson")
  //       .then((res) => res.json())
  //       .then((data) => {
  //         setGeojsonData(data);
  //       });
  //   }, []);

  useEffect(() => {
    console.log("features", features);
  }, [features]);

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
        style={{ width: "100vw", height: "100vh" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        projection={{ name: "mercator" } as mapboxgl.Projection}
        onMouseMove={onHover}
        onClick={onClick}
        interactiveLayerIds={["counties"]}
      >
        {geojsonData && (
          <ViewMapLayers hoverInfo={hoverInfo} data={geojsonData} />
        )}
        <GeolocateControl position="top-left" />
        <NavigationControl position="top-left" />
        <ScaleControl />
      </Map>
    </div>
  );
};
