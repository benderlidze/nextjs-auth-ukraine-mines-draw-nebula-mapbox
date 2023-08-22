"use client";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import bbox from "@turf/bbox";
import { ProjectSelector } from "../ProjectSelector";
import { ProjectInfo } from "@/components/ProjectInfo";
import { FeatureCollection } from "geojson";
import { PolygonData, PolygonInfoBox } from "../PolygonInfoBox";

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

export function MapboxGLMap(): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const [projectList, setProjectList] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectData, setProjectData] = useState<ProjectData>(
    {} as ProjectData
  );

  const [regionsChecked, setRegionsChecked] = useState(true);
  const [districtsChecked, setDistrictsChecked] = useState(true);
  const [polygonObjectsChecked, setPolygonObjectsChecked] = useState(true);
  const [polygonData, setPolygonData] = useState<PolygonData>();

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
        if (!drawRef.current) return;
        drawRef.current.deleteAll(); //clear prev geometry

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

        setProjectData(data);
      });
  };

  const handleSaveProject = () => {
    if (!drawRef.current) return;
    const draw = drawRef.current;

    const drawData = draw.getAll();
    //remove id from features
    const geometry = drawData.features.map(({ id, ...rest }) => {
      return {
        id: null,
        ...rest,
      };
    });

    console.log("geometry", geometry);

    const postData = {
      id: projectId,
      params: {
        project: projectData.project,
        objects: {
          type: "FeatureCollection",
          features: geometry,
        },
      },
    };

    console.log("postData", postData);

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
      "address__district",
      "visibility",
      checked ? "visible" : "none"
    );
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

        {polygonData && <PolygonInfoBox polygonData={polygonData} />}

        <button
          className="bg-white p-2 border border-solid border-gray-300"
          onClick={handleSaveProject}
        >
          Save project
        </button>
      </div>

      <div className="absolute bottom-[10px] left-[10px] z-10 bg-white p-[20px]">
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
      </div>

      <div
        style={{ width: "100vw", height: "100vh" }}
        ref={mapContainerRef}
        className="map-container"
      />
    </div>
  );
}
