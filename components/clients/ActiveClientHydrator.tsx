"use client";

import { useEffect } from "react";
import { useActiveClient } from "@/components/stores/useActiveClient";
import type { Client } from "@/lib/schemas";

export function ActiveClientHydrator({ client }: { client: Client }) {
  const setClient = useActiveClient((s) => s.setClient);
  useEffect(() => {
    setClient(client);
  }, [client, setClient]);
  return null;
}
