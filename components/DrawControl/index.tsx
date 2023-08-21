import { useMap } from "react-map-gl";
import React from "react";
import MapboxDraw, {
  DrawMode,
  DrawModeChangeEvent,
} from "@mapbox/mapbox-gl-draw";
import { useControl } from "react-map-gl";
import type { ControlPosition } from "react-map-gl";
import { Feature } from "geojson";
//@mapbox/mapbox-gl-draw css
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

export type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;
  onCreate?: (event: { features: Feature[] }) => void;
  onUpdate?: (event: { features: Feature[]; action: string }) => void;
  onDelete?: (event: { features: Feature[] }) => void;
  onModeChange?: (event: DrawModeChangeEvent) => void;
};

// eslint-disable-next-line react/display-name
export const DrawControl = React.forwardRef<MapboxDraw, DrawControlProps>(
  (props: DrawControlProps, ref) => {
    const { position, onCreate, onUpdate, onDelete, onModeChange, ...rest } =
      props;

    const drawRef = useControl(
      () => new MapboxDraw(props),
      ({ map }) => {
        onCreate && map.on("draw.create", onCreate);
        onUpdate && map.on("draw.update", onUpdate);
        onDelete && map.on("draw.delete", onDelete);
        onModeChange && map.on("draw.modechange", onModeChange);
        
      },
      ({ map }) => {
        onCreate && map.off("draw.create", onCreate);
        onUpdate && map.off("draw.update", onUpdate);
        onDelete && map.off("draw.delete", onDelete);
        onModeChange && map.off("draw.modechange", onModeChange);
      },
      {
        position,
      }
    );
    // forwarding the Draw Ref external
    React.useImperativeHandle(ref, () => drawRef, [drawRef]);
    return null;
  }
);
