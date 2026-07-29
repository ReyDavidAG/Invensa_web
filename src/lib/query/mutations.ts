"use client";

/* Hallmark · locked system applied · src/lib/query/mutations.ts
 * React Query mutation hooks for Server Actions. Each hook wraps one
 * server action and exposes isPending / error / data so forms can
 * disable controls and surface messages without useState gymnastics.
 *
 * Pattern: mutationFn returns the full discriminated union from the
 * action (no throw). The caller reads `mutation.data?.ok` to decide
 * between success and error. This preserves field-level errors that
 * a throw would lose.
 */

import { useMutation } from "@tanstack/react-query";

import {
  type ProductActionResult,
  archiveProductAction,
  createProductAction,
  updateProductAction,
} from "@/app/actions/products";
import {
  type TaxonomyActionResult,
  createCategoryAction,
  createUnitAction,
} from "@/app/actions/taxonomy";

export function useCreateProduct() {
  return useMutation<ProductActionResult, Error, FormData>({
    mutationFn: (formData) => createProductAction(null, formData),
  });
}

export function useUpdateProduct(productId: string) {
  return useMutation<ProductActionResult, Error, FormData>({
    mutationFn: (formData) => updateProductAction(productId, null, formData),
  });
}

export function useArchiveProduct() {
  return useMutation<ProductActionResult, Error, string>({
    mutationFn: (productId) => archiveProductAction(productId),
  });
}

export function useCreateCategory() {
  return useMutation<TaxonomyActionResult, Error, string>({
    mutationFn: (name) => createCategoryAction(name),
  });
}

export function useCreateUnit() {
  return useMutation<TaxonomyActionResult, Error, string>({
    mutationFn: (name) => createUnitAction(name),
  });
}
