import * as React from "react";
import { MapboxGLMap } from "@/components/MapboxGL";

export default function MapPage() {
  return (
    <div className="flex h-screen ">
      <MapboxGLMap />
    </div>
  );
}
