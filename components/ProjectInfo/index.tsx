import { Project } from "@/components/MapboxGL";

interface ProjectInfoProps {
  project: Project;
}

export const ProjectInfo = ({ project }: ProjectInfoProps) => {
  return (
    <div>
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="text-sm">{project.description}</p>
    </div>
  );
};
