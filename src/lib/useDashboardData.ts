"use client";

import { useEffect, useState } from "react";
import type { BranchRow } from "@/types";

export function useYears() {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/years")
      .then((r) => r.json())
      .then((data) => {
        setYears(data);
        setLoading(false);
      });
  }, []);

  return { years, loading };
}

export interface YearMeta {
  year: number;
  monthsCovered: number;
}

/** Same as useYears but also returns monthsCovered per year, for fair
 *  partial-year comparisons on the Yearly Comparison page. */
export function useYearsMeta() {
  const [yearsMeta, setYearsMeta] = useState<YearMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/years?detail=true")
      .then((r) => r.json())
      .then((data) => {
        setYearsMeta(data);
        setLoading(false);
      });
  }, []);

  return { yearsMeta, loading };
}

export function useBranchRows(year?: number, division?: string) {
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (division) params.set("division", division);
    fetch(`/api/branches?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      });
  }, [year, division]);

  return { rows, loading, refetch: () => setRows((r) => [...r]) };
}

export const DIVISIONS = ["Karachchi", "Kandawalai", "Poonakary", "Pachchilaipalli"];
