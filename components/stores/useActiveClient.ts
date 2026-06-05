"use client";

import { create } from "zustand";
import type { Client } from "@/lib/schemas";

interface ActiveClientState {
  client: Client | null;
  setClient: (c: Client | null) => void;
}

export const useActiveClient = create<ActiveClientState>((set) => ({
  client: null,
  setClient: (c) => set({ client: c }),
}));
