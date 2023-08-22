"use client";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import bbox from "@turf/bbox";
import { ProjectSelector } from "../ProjectSelector";
import { profileEnd } from "console";
import { ProjectInfo } from "@/components/ProjectInfo";

export interface Project {
  id: number;
  uuid: string;
  name?: string;
  description?: string;
  organization_id: number;
  is_active?: boolean;
}

export function ViewMap(): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const [projectList, setProjectList] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiY2NoYW5nc2EiLCJhIjoiY2lqeXU3dGo1MjY1ZXZibHp5cHF2a3Q1ZyJ9.8q-mw77HsgkdqrUHdi-XUg"; // Replace with your Mapbox access token
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/light-v11", // Choose your desired map style
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

    map.on("load", () => {
      mapRef.current = map;
      drawRef.current = draw;

      console.log("map", map);

      map.addSource("address__region", {
        type: "vector",
        tiles: [
          "http://135.181.151.145:8000/get_tile/{z}/{x}/{y}/address__region/",
        ],
        maxzoom: 7,
      });
      map.addLayer({
        id: "address__region",
        type: "fill",
        source: "address__region",
        "source-layer": "address__region",
        paint: {
          "fill-color": "rgba(200, 100, 240, 0.1)",
          "fill-outline-color": "rgba(200, 100, 240, 1)",
        },
      });

      map.addSource("address__district", {
        type: "vector",
        tiles: [
          "http://135.181.151.145:8000/get_tile/{z}/{x}/{y}/address__district/",
        ],
        minzoom: 7,
        maxzoom: 22,
      });
      map.addLayer({
        id: "address__district",
        type: "fill",
        source: "address__district",
        "source-layer": "address__district",
        paint: {
          "fill-color": "rgba(200, 100, 240, 0.1)",
          "fill-outline-color": "rgba(200, 100, 240, 1)",
        },
      });

      map.addSource("fields", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Add a new layer to visualize the polygon.
      map.addLayer({
        id: "fields",
        type: "fill",
        source: "fields", // reference the data source
        layout: {},
        paint: {
          "fill-color": "#0080ff", // blue color fill
          "fill-opacity": 0.5,
        },
      });
      // Add a black outline around the polygon.
      map.addLayer({
        id: "fields_outline",
        type: "line",
        source: "fields",
        layout: {},
        paint: {
          "line-color": "#000",
          "line-width": 3,
        },
      });
    });

    getUserProjects();

    return () => {
      map.remove();
    };
  }, []);

  const handleGetProject = (projectId: number) => {
    console.log("projectId", projectId, !projectId, !isNaN(projectId));
    if (!projectId || isNaN(projectId)) return;

    fetch(`http://135.181.151.145:8000/get_project/${projectId}/`)
      .then((response) => response.json())
      .then((data) => {
        const featureCollection = data.objects;
        if (featureCollection && featureCollection.features.length > 0) {
          const geoJsonSource = mapRef.current?.getSource("fields");
          if (geoJsonSource && geoJsonSource.type === "geojson") {
            geoJsonSource.setData(featureCollection);
          }

          const bboxCoords = bbox(featureCollection);
          console.log("bboxCoords", bboxCoords);
          const [x1, y1, x2, y2] = bboxCoords; //typescript  err fix
          mapRef.current?.fitBounds([x1, y1, x2, y2], {
            padding: 50,
            speed: 4,
          });
        }
      });
  };

  const getUserProjects = async () => {
    const postData = {
      schema: "data",
      table: "project",
      fields: "id, name, uuid,organization_id, description, is_active ",
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
        setProjectList(data);
      });
  };

  const handleProjectSelect = (projectId: number) => {
    console.log("projectId", projectId);
    setProjectId(projectId);
    handleGetProject(+projectId);
  };

  return (
    <div>
      <div className="absolute flex gap-5 top-[10px] left-[10px] z-10 bg-white p-[20px] flex-col">
        {projectList && (
          <ProjectSelector data={projectList} onSelect={handleProjectSelect} />
        )}
        {projectList && projectId && (
          <ProjectInfo
            project={projectList.find((project) => project.id === projectId)!}
          />
        )}
      </div>
      <div
        style={{ width: "100vw", height: "100vh" }}
        ref={mapContainerRef}
        className="map-container"
      />
    </div>
  );
}
