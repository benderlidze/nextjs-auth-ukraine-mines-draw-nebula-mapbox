import { GeometryCollectionProps } from "@/components/MapboxMap";

interface SaveDataContainerProps {
  data: GeometryCollectionProps;
}

export const SaveDataContainer = ({ data }: SaveDataContainerProps) => {
  const handleSaveData = () => {
    console.log("Save data to db", data);

    fetch("/api/save-all-project-data", {
      method: "POST",
      body: JSON.stringify({ data }),
    })
      .then((resp) => resp.json())
      .then((json) => {
        // setLineData(json);
        console.log("RESP JSON", json);
        if (json && json.saved) {
          console.log("Saved");
        }
      })
      .catch((err) => console.error("Could not load data", err)); // eslint-disable
  };

  return (
    <div
      onClick={handleSaveData}
      className="absolute  ml-10 mt-[10px] right-[50px] z-10 border-2 border-red-300 p-1 bg-white rounded-md p-4"
    >
      <button>Save geometry</button>
    </div>
  );
};
