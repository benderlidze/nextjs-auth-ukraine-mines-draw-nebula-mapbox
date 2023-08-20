import * as React from "react";
import { MapContainer } from "@/components/MapboxMap";

export default function MapPage() {
  return (
    <div className="flex h-screen bg-black">
      <div className="w-screen h-screen flex flex-col space-y-5 justify-center items-center border-1">
        <MapContainer />
      </div>
    </div>
  );
}
