import { Project } from "@/components/MapboxGL";

interface ProjectSelectorProps {
  data: Project[];
  onSelect: (projectId: number) => void;
}

export const ProjectSelector = ({ data, onSelect }: ProjectSelectorProps) => {
  return (
    <select
      className="block w-full p-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
      onChange={(e) => onSelect(Number(e.target.value))}
    >
      <option value="">Select project</option>
      {data.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
};
