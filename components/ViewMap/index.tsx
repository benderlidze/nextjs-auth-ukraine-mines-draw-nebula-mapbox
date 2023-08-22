"use client";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import bbox from "@turf/bbox";
import { FeatureCollection } from "geojson";

export interface Project {
  id: number;
  uuid: string;
  name?: string;
  description?: string;
  organization_id: number;
  is_active?: boolean;
}

export interface ProjectData {
  objects: FeatureCollection;
  project: Project;
}

export interface HazardType {
  id: number;
  name: string;
}
export interface StatusType {
  id: number;
  name: string;
}

export interface UpdatePolygonData {
  polygonId: string;
  polygonPropName: string;
  value: string | number;
}

export interface PolygonInfo {
  description: string;
  geom_area: number;
  hazard_type_name: string;
  organization_address: string;
  organization_description: string;
  organization_name: string;
  project_description: string;
  project_name: string;
  status_name: string;
}

export function ViewMap(): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const [projectInfo, setProjectInfo] = useState<PolygonInfo>();
  const [viewPolygonId, setViewPolygonId] = useState<number>();

  //layers
  const [regionsChecked, setRegionsChecked] = useState(true);
  const [districtsChecked, setDistrictsChecked] = useState(true);
  const [polygonObjectsChecked, setPolygonObjectsChecked] = useState(true);
  const [kadastrChecked, setKadastrChecked] = useState(false);
  const [satelliteChecked, setSatelliteChecked] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiY2NoYW5nc2EiLCJhIjoiY2lqeXU3dGo1MjY1ZXZibHp5cHF2a3Q1ZyJ9.8q-mw77HsgkdqrUHdi-XUg"; // Replace with your Mapbox access token
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/streets-v12", // Choose your desired map style
      center: [31.171318441368896, 49.38952608677255], // Initial center coordinates
      zoom: 5, // Initial zoom level
      projection: { name: "mercator" } as mapboxgl.Projection,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(draw);

    map.on("load", () => {
      mapRef.current = map;
      drawRef.current = draw;

      console.log("map", map);

      map.addSource("satellite", {
        type: "raster",
        tiles: [
          "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/{z}/{x}/{y}?access_token=" +
            mapboxgl.accessToken,
        ],
      });

      map.addLayer({
        id: "satellite",
        type: "raster",
        source: "satellite",
        layout: {
          visibility: satelliteChecked ? "visible" : "none",
        },
      });

      map.addSource("kadastr", {
        type: "raster",
        tiles: [
          "https://cdn.kadastr.live/tiles/raster/styles/parcels/{z}/{x}/{y}.png",
        ],
      });
      map.addLayer({
        id: "kadastr",
        type: "raster",
        source: "kadastr",
        layout: {
          visibility: kadastrChecked ? "visible" : "none",
        },

        minzoom: 0,
        maxzoom: 22,
      });

      map.addSource("address__district", {
        type: "vector",
        tiles: [
          "http://135.181.151.145:8000/get_tile/{z}/{x}/{y}/address__district/",
        ],
      });
      map.addLayer({
        id: "address__district",
        type: "line",
        layout: {
          visibility: "visible",
        },
        source: "address__district",
        "source-layer": "address__district",
        paint: {
          "line-color": "rgba(200, 100, 240, 5)",
        },
      });

      map.addSource("address__region", {
        type: "vector",
        tiles: [
          "http://135.181.151.145:8000/get_tile/{z}/{x}/{y}/address__region/",
        ],
        maxzoom: 7,
      });
      map.addLayer({
        id: "address__region",
        type: "line",
        source: "address__region",
        "source-layer": "address__region",
        layout: {
          visibility: "visible",
        },
        paint: {
          "line-color": "black",
        },
      });

      map.addSource("address__object", {
        type: "vector",
        tiles: ["http://135.181.151.145:8000/get_tile/{z}/{x}/{y}/object/"],
      });
      map.addLayer({
        id: "address__object",
        type: "fill",
        layout: {
          visibility: "visible",
        },
        source: "address__object",
        "source-layer": "object",
        paint: {
          "fill-color": "rgba(200, 100, 240, 0.1)",
          "fill-outline-color": "rgba(200, 100, 240, 1)",
        },
      });

      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point);
        console.log("features", features);
        const polygonFeatures = features.filter(
          (d) => d.layer.id === "address__object"
        );
        if (polygonFeatures.length > 0) {
          const polygonId = polygonFeatures[0]?.id;
          console.log("polygonId", polygonId);
          polygonId && setViewPolygonId(+polygonId); //????
          polygonId && getPolygonInfo(+polygonId);
        }
      });
    });
  }, []);

  const getPolygonInfo = (viewPolygonId: number) => {
    if (!viewPolygonId || isNaN(viewPolygonId)) return;

    const postData = {
      schema: "data",
      table: "object__view",
      fields:
        "id, organization_name, organization_address, organization_description, project_name, project_description, address_region_name, address_district_name, hazard_type_name, status_name, description, data_time, geom_area",
      where: `id = ${viewPolygonId}`,
    };

    fetch("http://135.181.151.145:8000/get_table_json/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        setProjectInfo(data[0]);
      });
  };

  const handleRegionsVisibility = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setRegionsChecked(checked);
    mapRef.current?.setLayoutProperty(
      "address__region",
      "visibility",
      checked ? "visible" : "none"
    );
  };
  const handleDistrictsVisibility = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setDistrictsChecked(checked);
    mapRef.current?.setLayoutProperty(
      "address__district",
      "visibility",
      checked ? "visible" : "none"
    );
  };
  const handlePolygonObjectsVisibility = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setPolygonObjectsChecked(checked);
    mapRef.current?.setLayoutProperty(
      "address__object",
      "visibility",
      checked ? "visible" : "none"
    );
  };

  const handleKadastrObjectsVisibility = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setKadastrChecked(checked);
    mapRef.current?.setLayoutProperty(
      "kadastr",
      "visibility",
      checked ? "visible" : "none"
    );
  };

  const handleSatelliteVisibility = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setSatelliteChecked(checked);
    mapRef.current?.setLayoutProperty(
      "satellite",
      "visibility",
      checked ? "visible" : "none"
    );
  };
  console.log("projectInfo", projectInfo);
  return (
    <div>
      <div
        style={{
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 20px",
          backgroundColor: "#f5f5fb",
        }}
        className="absolute bottom-[10px] left-[10px] z-10 bg-white p-[20px]"
      >
        <div className="m-[10px]">
          <input
            type="checkbox"
            id="regions"
            checked={regionsChecked}
            onChange={handleRegionsVisibility}
          />
          <label
            htmlFor="regions"
            className="pl-2 cursor-pointer user-select-none"
          >
            Regions
          </label>
        </div>
        <div className="m-[10px]">
          <input
            type="checkbox"
            id="districts"
            checked={districtsChecked}
            onChange={handleDistrictsVisibility}
          />
          <label
            htmlFor="districts"
            className="pl-2 cursor-pointer user-select-none"
          >
            Districts
          </label>
        </div>

        <div className="m-[10px]">
          <input
            type="checkbox"
            id="polygons"
            checked={polygonObjectsChecked}
            onChange={handlePolygonObjectsVisibility}
          />
          <label
            htmlFor="polygons"
            className="pl-2 cursor-pointer user-select-none"
          >
            Polygon Objects
          </label>
        </div>

        <div className="m-[10px]">
          <input
            type="checkbox"
            id="kadastr"
            checked={kadastrChecked}
            onChange={handleKadastrObjectsVisibility}
          />
          <label
            htmlFor="kadastr"
            className="pl-2 cursor-pointer user-select-none"
          >
            Kadastr
          </label>
        </div>

        <div className="m-[10px]">
          <input
            type="checkbox"
            id="satellite"
            checked={satelliteChecked}
            onChange={handleSatelliteVisibility}
          />
          <label
            htmlFor="satellite"
            className="pl-2 cursor-pointer user-select-none"
          >
            Satellite
          </label>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100vw",
          border: "0px solid red",
          backgroundColor: "#f5f5fb",
        }}
      >
        <div
          style={{ flex: " 1 0", height: "100vh" }}
          ref={mapContainerRef}
          className="map-container"
        />
        <div style={{ width: "300px" }}>
          <div className="flex gap-5 p-4 flex-col">
            {projectInfo && (
              <>
                <div className="flex gap-5 flex-col">
                  <div><b>{projectInfo.project_name}</b></div>
                  <div>
                    Project description: {projectInfo.project_description}
                  </div>
                  <div>Object description: {projectInfo.description}</div>
                  <div>Hazard type: {projectInfo.hazard_type_name}</div>
                  <div>Status: {projectInfo.status_name}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
