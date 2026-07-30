import type { DriveStep } from "driver.js";

export type Tour = {
  id: string;
  title: string;
  description: string;
  route?: string; // pathname the tour applies to
  steps: DriveStep[];
};