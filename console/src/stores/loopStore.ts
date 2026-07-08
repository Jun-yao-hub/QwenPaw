import { create } from "zustand";
import { request } from "@/api/request";

export interface LoopSkillInfo {
  name: string;
  description: string;
  icon?: string;
}

interface LoopState {
  selectedSkill: LoopSkillInfo | null;
  chipHighlighted: boolean;

  availableSkills: LoopSkillInfo[];
  /** Non-plugin system commands (daemon, control, conversation) fetched
   * from /workspace/commands/available — used for slash autocomplete. */
  systemCommands: LoopSkillInfo[];

  setSelectedSkill: (skill: LoopSkillInfo | null) => void;
  setChipHighlighted: (highlighted: boolean) => void;
  setAvailableSkills: (skills: LoopSkillInfo[]) => void;
  setSystemCommands: (commands: LoopSkillInfo[]) => void;
}

export const useLoopStore = create<LoopState>((set) => ({
  selectedSkill: null,
  chipHighlighted: false,
  availableSkills: [],
  systemCommands: [],

  setSelectedSkill: (skill) =>
    set({ selectedSkill: skill, chipHighlighted: false }),
  setChipHighlighted: (highlighted) => set({ chipHighlighted: highlighted }),
  setAvailableSkills: (skills) => set({ availableSkills: skills }),
  setSystemCommands: (commands) => set({ systemCommands: commands }),
}));

interface CommandsResponse {
  commands: Array<{
    name: string;
    description: string;
    category: string;
  }>;
}

export async function fetchAvailableLoopSkills(): Promise<void> {
  try {
    const res = await request<CommandsResponse>(
      "/workspace/commands/available",
    );
    const commands = res?.commands ?? [];
    const loopSkills: LoopSkillInfo[] = commands
      .filter((c) => c.category === "plugin")
      .map((c) => ({
        name: c.name,
        description: c.description || c.name,
      }));
    if (loopSkills.length > 0) {
      useLoopStore.getState().setAvailableSkills(loopSkills);
    }
    // Also store system commands (daemon, control, conversation) so the
    // Chat component can include them in the slash autocomplete menu.
    const systemCommands: LoopSkillInfo[] = commands
      .filter((c) => c.category !== "plugin")
      .map((c) => ({
        name: c.name,
        description: c.description || "",
      }));
    useLoopStore.getState().setSystemCommands(systemCommands);
  } catch {
    // Silently fall back to empty list
  }
}
