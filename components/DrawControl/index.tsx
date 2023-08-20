import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useControl } from "react-map-gl";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { ControlPosition } from "react-map-gl";

type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition;

  onCreate?: (evt: MapboxDraw.DrawCreateEvent) => void;
  onUpdate?: (evt: MapboxDraw.DrawUpdateEvent) => void;
  onDelete?: (evt: MapboxDraw.DrawDeleteEvent) => void;
  onModeChange?: (evt: MapboxDraw.DrawModeChangeEvent) => void;
};
declare type Listener = (event?: any) => any;

export function DrawControl(props: DrawControlProps) {
  useControl<MapboxDraw>(
    () => new MapboxDraw(props),
    ({ map }) => {
      map.on("draw.create", props.onCreate as Listener);
      map.on("draw.update", props.onUpdate as Listener);
      map.on("draw.delete", props.onDelete as Listener);
      map.on("draw.modechange", props.onModeChange as Listener);
    },
    ({ map }) => {
      map.off("draw.create", props.onCreate);
      map.off("draw.update", props.onUpdate);
      map.off("draw.delete", props.onDelete);
      map.on("draw.modechange", props.onModeChange as Listener);
    },
    {
      position: props.position,
    }
  );

  return null;
}
