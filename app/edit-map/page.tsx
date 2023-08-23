import * as React from "react";
import { MapboxGLMap } from "@/components/MapboxGL";
import Providers from "@/components/Providers";

export default function MapPage() {
  return (
    <div className="flex h-screen ">
      <Providers>
        <MapboxGLMap />
      </Providers>
    </div>
  );
}
