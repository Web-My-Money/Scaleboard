"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
  expandedGroups: Record<string, boolean>;
  toggleCollapsed: () => void;
  setCollapsed: (v: boolean) => void;
  toggleGroup: (key: string) => void;
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      expandedGroups: { active: true, onboarding: true, paused: false, archived: false },
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (v: boolean) => set({ collapsed: v }),
      toggleGroup: (key) =>
        set((s) => ({
          expandedGroups: { ...s.expandedGroups, [key]: !s.expandedGroups[key] },
        })),
    }),
    { name: "wmm-sidebar" },
  ),
);
