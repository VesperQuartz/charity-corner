import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc";

export const useVendorPage = () => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const vendorsQuery = useQuery(orpc.getVendors.queryOptions());
  const productsQuery = useQuery(orpc.getProducts.queryOptions());
  const supplyEntriesQuery = useQuery(orpc.getSupplyEntries.queryOptions());
  const transactionsQuery = useQuery(orpc.getTransactions.queryOptions());

  const createVendorMutation = useMutation(
    orpc.createVendor.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getVendors.queryKey() });
      },
    }),
  );
  const updateVendorMutation = useMutation(
    orpc.updateVendor.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getVendors.queryKey() });
      },
    }),
  );
  const deleteVendorMutation = useMutation(
    orpc.deleteVendor.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.getVendors.queryKey() });
      },
    }),
  );
  const createProductMutation = useMutation(
    orpc.createProduct.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const updateProductMutation = useMutation(
    orpc.updateProduct.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const createSupplyEntryMutation = useMutation(
    orpc.createSupplyEntry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getSupplyEntries.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const updateSupplyEntryMutation = useMutation(
    orpc.updateSupplyEntry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getSupplyEntries.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );
  const deleteSupplyEntryMutation = useMutation(
    orpc.deleteSupplyEntry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.getSupplyEntries.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.getProducts.queryKey(),
        });
      },
    }),
  );

  const vendors = vendorsQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const supplies = supplyEntriesQuery.data ?? [];

  return {
    vendors,
    products,
    supplies,
    transactions: transactionsQuery.data ?? [],
    isLoading: vendorsQuery.isLoading || productsQuery.isLoading || supplyEntriesQuery.isLoading,
    isPending,
    startTransition,
    createVendorMutation,
    updateVendorMutation,
    deleteVendorMutation,
    createProductMutation,
    updateProductMutation,
    createSupplyEntryMutation,
    updateSupplyEntryMutation,
    deleteSupplyEntryMutation,
  };
};
