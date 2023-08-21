"use client";
import React, { useEffect, useRef } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import bbox from "@turf/bbox";

export function MapboxGLMap(): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

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
    map.addControl(draw);

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
    });

    return () => {
      map.remove();
    };
  }, []);

  const handleGetProject = async () => {
    const projectId = 2;
    console.log("drawRef", drawRef);

    fetch(`http://135.181.151.145:8000/get_project/${projectId}/`)
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        const featureCollection = data.objects;
        if (featureCollection && featureCollection.features.length > 0) {
          drawRef.current?.add(featureCollection);

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

  const handleSaveProject = async () => {
    const projectId = 2;

    if (!drawRef.current) return;
    const draw = drawRef.current;

    const geometry = draw.getAll();
    console.log("geometry", geometry);

    const postData = {
      id: projectId,
      params: {
        project: {
          id: 2,
          uuid: "ea24e437-8a3b-4c6a-abb9-b8783a450d4a",
          organization_id: 1,
          name: "Project 2",
          description: "description for project 2",
          is_active: true,
        },
        objects: {
          ...geometry,
        },
      },
    };

    fetch("http://135.181.151.145:8000/set_project/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
      });
  };

  return (
    <div>
      <div className="absolute flex gap-5 top-[10px] left-[10px] z-10">
        <button
          className="bg-white p-2 border border-solid border-gray-300"
          onClick={handleGetProject}
        >
          Load project
        </button>
        <button
          className="bg-white p-2 border border-solid border-gray-300"
          onClick={handleSaveProject}
        >
          Save project
        </button>
      </div>
      <div
        style={{ width: "100vw", height: "100vh" }}
        ref={mapContainerRef}
        className="map-container"
      />
    </div>
  );
}
