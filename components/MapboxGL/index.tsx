"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl, { Map, MapboxEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw, {
  DrawEvent,
  DrawEventType,
  DrawSelectionChangeEvent,
} from "@mapbox/mapbox-gl-draw";
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

export interface HazardType {
  id: number;
  name: string;
}

export interface UpdatePolygonData {
  polygonId: string;
  polygonPropName: string;
  value: string | number;
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
  //layers
  const [regionsChecked, setRegionsChecked] = useState(true);
  const [districtsChecked, setDistrictsChecked] = useState(true);
  const [polygonObjectsChecked, setPolygonObjectsChecked] = useState(true);
  const [kadastrChecked, setKadastrChecked] = useState(false);

  const [polygonData, setPolygonData] = useState<PolygonData>();
  const [hazardTypes, setHazardTypes] = useState<HazardType[]>([]);

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
    });

    getUserProjects();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.on("draw.selectionchange", handlePolygonSelection);
    return () => {
      mapRef.current?.off("draw.selectionchange", handlePolygonSelection);
    };
  }, [projectData]);

  const handlePolygonSelection = (e: DrawSelectionChangeEvent) => {
    console.log("draw.selectionchange", e);
    console.log("project data", projectData);
    if (!e.features[0] || !e.features[0].id) return;

    // const selectedFeatures = e.features;
    // const id = selectedFeatures[0].id;
    // const polygonProps = projectData.objects.features.find((d) => d.id === id);
    // console.log("polygonProps", polygonProps);

    const data = drawRef.current
      ?.getAll()
      .features.find((d) => d.id === e.features[0].id);
    console.log("data", data);

    data && data.properties && setPolygonData(data.properties as PolygonData);
  };

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

  useEffect(() => {
    console.log("!!!!!!!!projectData!!!!!!!!!");
    console.log(projectData);
    console.log("!!!!!!!!!!!!!!!!!");

    //UPDATE DRAW DATA
    //  drawRef.current?.deleteAll();
    //  drawRef.current?.set(projectData.objects);
  }, [projectData]);

  const handleSaveProject = () => {
    if (!drawRef.current) return;
    const draw = drawRef.current;
    const drawData = draw.getAll();
    //remove id from features

    const postData = {
      id: projectId,
      params: {
        project: projectData.project,
        objects: {
          type: "FeatureCollection",
          features: drawData.features.map(({ id, ...rest }) => {
            return {
              id: null,
              ...rest,
            };
          }),
        },
      },
    };

    console.log("postData---->>>>", postData);

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

    const hazard = {
      schema: "data",
      table: "hazard_type",
      fields: "id, name",
    };
    fetch("http://135.181.151.145:8000/get_table_json/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hazard),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        setHazardTypes(data);
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

  const updateProjectPolygonData = ({
    polygonId,
    polygonPropName,
    value,
  }: UpdatePolygonData) => {
    if (!polygonData) return;

    console.log(polygonId, polygonPropName, value);

    if (!drawRef.current) return;
    drawRef.current.setFeatureProperty(polygonId, polygonPropName, value);

    //update polygon data with new props
    const data = drawRef.current
      ?.getAll()
      .features.find((d) => d.id === polygonId);
    data && data.properties && setPolygonData(data.properties as PolygonData);

    // projectData.objects.features.forEach((feature) => {
    //   if (feature.id === polygonId) {
    //     feature.properties && (feature.properties[polygonPropName] = value);
    //   }
    // });

    // console.log("projectData", projectData);
    // const newProjectData = {
    //   ...projectData,
    //   objects: {
    //     ...projectData.objects,
    //     features: [...projectData.objects.features],
    //   },
    // };
    // setProjectData(newProjectData);
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

        {polygonData && (
          <PolygonInfoBox
            polygonData={polygonData}
            hazardTypes={hazardTypes}
            updatePolygonData={updateProjectPolygonData}
          />
        )}

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
      </div>

      <div
        style={{ width: "100vw", height: "100vh" }}
        ref={mapContainerRef}
        className="map-container"
      />
    </div>
  );
}
