import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectOption {
  value: number;
  label: string;
  projectName?: string;
  product?: string;
  projectNo?: string;
  planningId?: number;
}

interface ProjectStore {
  projects: ProjectOption[];
  addProject: (project: any) => void;
  updateProject: (project: any) => void;
  removeProject: (planningId: number) => void;
  setProjects: (projects: any[]) => void;
  getProjectOptions: () => ProjectOption[];
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (project: any) => {
        const newProjectOption: ProjectOption = {
          value: project.projectNo,
          label: `${project.projectNo} - ${
            project.product || project.projectName || "Project"
          }`,
          projectName: project.projectName,
          product: project.product,
          projectNo: project.projectNo,
        };

        set((state) => ({
          projects: [
            ...state.projects.filter((p) => p.value !== project.projectNo),
            newProjectOption,
          ],
        }));
      },

      updateProject: (project: any) => {
        const updatedProjectOption: ProjectOption = {
          value: project.projectNo,
          label: `${project.projectNo} - ${
            project.product || project.projectName || "Project"
          }`,
          projectName: project.projectName,
          product: project.product,
          projectNo: project.projectNo,
        };

        set((state) => ({
          projects: state.projects.map((p) =>
            p.value === project.projectNo ? updatedProjectOption : p
          ),
        }));
      },

      removeProject: (planningId: number) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.value !== planningId),
        }));
      },

      setProjects: (projects: any[]) => {
        const projectOptions: ProjectOption[] = projects.map((project) => ({
          value: project.planningId,
          label: `${project.projectNo} - ${
            project.product || project.projectName || "Project"
          }`,
          projectName: project.projectName,
          product: project.product,
          projectNo: project.projectNo,
        }));

        set({ projects: projectOptions });
      },

      getProjectOptions: () => {
        const { projects } = get();
        return [
          { value: 0, label: "Select a project" },
          ...projects.sort((a, b) => a.label.localeCompare(b.label)),
        ];
      },
    }),
    {
      name: "project-store",
      version: 1,
    }
  )
);
