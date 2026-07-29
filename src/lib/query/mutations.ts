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
import {
  type SaleActionResult,
  cancelSaleAction,
  createSaleAction,
} from "@/app/actions/sales";
import {
  type CustomerActionResult,
  archiveCustomerAction,
  createCustomerAction,
  updateCustomerAction,
} from "@/app/actions/customers";
import {
  type ProfileActionResult,
  updateProfileAction,
} from "@/app/actions/profile";

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

export function useCreateSale() {
  return useMutation<SaleActionResult, Error, FormData>({
    mutationFn: (formData) => createSaleAction(null, formData),
  });
}

export function useCancelSale() {
  return useMutation<SaleActionResult, Error, string>({
    mutationFn: (saleId) => cancelSaleAction(saleId),
  });
}

export function useCreateCustomer() {
  return useMutation<CustomerActionResult, Error, FormData>({
    mutationFn: (formData) => createCustomerAction(null, formData),
  });
}

export function useUpdateCustomer(customerId: string) {
  return useMutation<CustomerActionResult, Error, FormData>({
    mutationFn: (formData) => updateCustomerAction(customerId, null, formData),
  });
}

export function useArchiveCustomer() {
  return useMutation<CustomerActionResult, Error, string>({
    mutationFn: (customerId) => archiveCustomerAction(customerId),
  });
}

export function useUpdateProfile() {
  return useMutation<ProfileActionResult, Error, FormData>({
    mutationFn: (formData) => updateProfileAction(null, formData),
  });
}
