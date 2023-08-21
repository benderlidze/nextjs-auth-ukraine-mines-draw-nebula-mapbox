import { useMap } from "react-map-gl";
import React from "react";
import MapboxDraw, {
  DrawMode,
  DrawModeChangeEvent,
} from "@mapbox/mapbox-gl-draw";
import { useControl } from "react-map-gl";
import type { ControlPosition } from "react-map-gl";
import { Feature } from "geojson";

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

// --------------------------------------------------------------------------------------------------------

export const Draw = () => {
  const { current: map } = useMap();
  const [drawMode, setDrawMode] = React.useState<DrawMode>("simple_select");
  const drawRef = React.useRef<MapboxDraw>(null);

  if (!map) {
    return null;
  }

  React.useEffect(() => {
    // it's ok here, drawRef is not undefined
    console.log("useEffect drawRef when app is loading", drawRef);
  }, [drawRef]);

  const onCreateOrUpdate = React.useCallback(
    (e: { features: Feature[] }) => {
      // Here drawRef would not be undefined
      console.log("drawRef under onCreateOrUpdate method", drawRef);
    },
    [drawRef]
  );

  console.log("Component Render: ", drawMode);

  const onDelete = React.useCallback((e) => {
    console.log(e.features);
  }, []);

  return (
    <DrawControl
      ref={drawRef}
      position="top-right"
      displayControlsDefault={false}
      controls={{
        polygon: true,
        trash: true,
      }}
      defaultMode="simple_select"
      modes={{ ...MapboxDraw.modes }}
      onCreate={onCreateOrUpdate}
      onUpdate={onCreateOrUpdate}
      onDelete={onDelete}
      onModeChange={({ mode }) => setDrawMode(mode)}
    />
  );
};
