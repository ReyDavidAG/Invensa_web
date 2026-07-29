"use client";

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
import {
  type PresignActionResult,
  requestProductImageUploadAction,
} from "@/app/actions/storage";
import {
  type InventoryMovementActionResult,
  createInventoryMovementAction,
} from "@/app/actions/inventory";
import {
  type ParseProductPhotoResult,
  parseProductPhotoAction,
} from "@/app/actions/ai-product";
import {
  type BulkCreateProductsResult,
  bulkCreateProductsAction,
} from "@/app/actions/bulk-products";
import {
  type PreviewTaxonomyResult,
  previewBulkTaxonomyAction,
} from "@/app/actions/bulk-products-preview";
import {
  type BulkInventoryMovementResult,
  bulkCreateInventoryMovementsAction,
} from "@/app/actions/inventory";
import {
  bulkSetProductImageAction,
  type BulkSetProductImageResult,
} from "@/app/actions/products";
import {
  type CashClosingActionResult,
  closeCashAction,
} from "@/app/actions/cash-closing";
import {
  type LowStockAlertResult,
  sendLowStockAlertAction,
} from "@/app/actions/alerts";

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

export function useRequestProductImageUpload() {
  return useMutation<PresignActionResult, Error, FormData>({
    mutationFn: (formData) => requestProductImageUploadAction(null, formData),
  });
}

export function useCreateInventoryMovement() {
  return useMutation<InventoryMovementActionResult, Error, FormData>({
    mutationFn: (formData) => createInventoryMovementAction(null, formData),
  });
}

export function useParseProductPhoto() {
  return useMutation<ParseProductPhotoResult, Error, FormData>({
    mutationFn: (formData) => parseProductPhotoAction(null, formData),
  });
}

export function useBulkCreateProducts() {
  return useMutation<BulkCreateProductsResult, Error, FormData>({
    mutationFn: (formData) => bulkCreateProductsAction(null, formData),
  });
}

export function usePreviewBulkTaxonomy() {
  return useMutation<PreviewTaxonomyResult, Error, FormData>({
    mutationFn: (formData) =>
      previewBulkTaxonomyAction(
        JSON.parse(String(formData.get("rows") ?? "[]")) as Array<{
          categoryName?: string;
          unitCode?: string;
        }>,
      ),
  });
}

export function useBulkCreateInventoryMovements() {
  return useMutation<BulkInventoryMovementResult, Error, FormData>({
    mutationFn: (formData) =>
      bulkCreateInventoryMovementsAction(null, formData),
  });
}

export function useBulkSetProductImage() {
  return useMutation<
    BulkSetProductImageResult,
    Error,
    { productIds: string[]; publicUrl: string }
  >({
    mutationFn: ({ productIds, publicUrl }) =>
      bulkSetProductImageAction(productIds, publicUrl),
  });
}

export function useCloseCash() {
  return useMutation<CashClosingActionResult, Error, FormData>({
    mutationFn: (formData) => closeCashAction(null, formData),
  });
}

export function useSendLowStockAlert() {
  return useMutation<LowStockAlertResult, Error, void>({
    mutationFn: () => sendLowStockAlertAction(),
  });
}
