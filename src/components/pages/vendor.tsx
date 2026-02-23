/** biome-ignore-all lint/a11y/noLabelWithoutControl: TODO */
"use client";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit2,
  FileSpreadsheet,
  Layers,
  LoaderCircle,
  Mail,
  Package,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import { Activity, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "react-hot-toast/headless";
import * as XLSX from "xlsx";
import z from "zod";
import { FormError } from "@/components/error-form";
import { orpc } from "@/lib/orpc";
import type { Product, Vendor } from "@/types";

const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required").trim(),
  contact: z.string().min(1, "Contact is required").trim(),
  email: z.string().email("Must be a valid email address").trim(),
});

const supplyFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  vendorName: z.string().min(1, "Vendor name is required").trim(),
  vendorId: z.string(),
  itemName: z.string().min(1, "Item name is required").trim(),
  productId: z.string(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  costPrice: z.number().min(0, "Cost price must be 0 or more"),
  sellingPrice: z.number().min(0, "Selling price must be 0 or more"),
  profit: z.number(),
  purchaseOrder: z.string(),
  lowStockThreshold: z.number().int().min(0),
});

const VendorPage = () => {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const vendorsQuery = useQuery(orpc.getVendors.queryOptions());
  const productsQuery = useQuery(orpc.getProducts.queryOptions());
  const supplyEntriesQuery = useQuery(orpc.getSupplyEntries.queryOptions());
  const t = useQuery(orpc.getTransactions.queryOptions());

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

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<"supplies" | "vendors">(
    "supplies",
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isBulkSupplyModalOpen, setIsBulkSupplyModalOpen] = useState(false);
  const [isBulkVendorModalOpen, setIsBulkVendorModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // Edit states
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  // Delete confirmation state
  const [supplyToDelete, setSupplyToDelete] = useState<string | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  // --- Table Filter & Sort State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });

  // --- Helpers ---
  const getLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const generatePO = () => {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PO-${date}-${random}`;
  };

  // --- Single Supply Form (TanStack Form) ---
  const initialSupplyForm = {
    date: getLocalDateStr(),
    vendorName: "",
    vendorId: "",
    itemName: "",
    productId: "",
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    profit: 0,
    purchaseOrder: generatePO(),
    lowStockThreshold: 10,
  };
  const supplyForm = useForm({
    defaultValues: initialSupplyForm,
    validators: { onSubmit: supplyFormSchema },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        console.log("Value", value);
        let finalVendorId = value.vendorId;
        if (!finalVendorId) {
          const nameEntered = value.vendorName.trim();
          const match = vendors.find(
            (v) => v.name.toLowerCase() === nameEntered.toLowerCase(),
          );
          if (match) {
            finalVendorId = match.id;
          } else {
            try {
              const created = await createVendorMutation.mutateAsync({
                name: nameEntered,
                contact: "-",
                email: "noreply@vendor.local",
              });
              finalVendorId = created.id;
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Failed to create vendor",
              );
              return;
            }
          }
        }

        let finalProductId = value.productId;
        if (!finalProductId) {
          try {
            const created = await createProductMutation.mutateAsync({
              name: value.itemName.trim(),
              costPrice: value.costPrice,
              sellingPrice: value.sellingPrice,
              stock: 0,
              vendorId: finalVendorId,
              lowStockThreshold: value.lowStockThreshold,
            });
            finalProductId = created.id;
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Failed to create product",
            );
            return;
          }
        } else {
          const existingProduct = products.find((p) => p.id === finalProductId);
          if (
            existingProduct &&
            existingProduct.lowStockThreshold !== value.lowStockThreshold
          ) {
            try {
              await updateProductMutation.mutateAsync({
                id: finalProductId,
                lowStockThreshold: value.lowStockThreshold,
              });
            } catch {
              // non-blocking
            }
          }
        }

        const payload = {
          date: value.date,
          vendorId: finalVendorId,
          productId: finalProductId,
          quantity: value.quantity,
          costPrice: value.costPrice,
          sellingPrice: value.sellingPrice,
          purchaseOrderNumber: value.purchaseOrder,
          isPaid: false,
        };

        try {
          if (editingSupplyId) {
            await updateSupplyEntryMutation.mutateAsync({
              id: editingSupplyId,
              ...payload,
            });
            toast.success("Supply record updated successfully");
          } else {
            await createSupplyEntryMutation.mutateAsync(payload);
            toast.success("New supply record added successfully");
          }
          closeSupplyModal();
        } catch (err) {
          console.error("Mutation Error Details:", err);
          toast.error(
            err instanceof Error ? err.message : "Failed to save supply entry",
          );
        }
      });
    },
  });

  // --- Bulk Supply Upload State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // --- Bulk Vendor Upload State ---
  const vendorFileInputRef = useRef<HTMLInputElement>(null);
  const [bulkVendorPreview, setBulkVendorPreview] = useState<any[]>([]);
  const [bulkVendorError, setBulkVendorError] = useState<string | null>(null);
  const [isProcessingBulkVendors, setIsProcessingBulkVendors] = useState(false);

  // --- Vendor Form (TanStack Form) ---
  const initialVendorForm = { name: "", contact: "", email: "" };
  const vendorForm = useForm({
    defaultValues: initialVendorForm,
    validators: { onSubmit: vendorFormSchema },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        if (editingVendorId) {
          updateVendorMutation.mutate(
            { id: editingVendorId, ...value },
            {
              onSuccess: () => {
                toast.success("Vendor updated successfully");
                closeVendorModal();
              },
              onError: (e) =>
                toast.error(
                  e instanceof Error ? e.message : "Failed to update vendor",
                ),
            },
          );
        } else {
          await createVendorMutation.mutateAsync(value, {
            onSuccess: () => {
              toast.success("New vendor added successfully");
              closeVendorModal();
            },
            onError: (e) =>
              toast.error(
                e instanceof Error ? e.message : "Failed to create vendor",
              ),
          });
        }
      });
    },
  });

  // --- Computed Data ---
  const tableData = useMemo(() => {
    let data = supplies.map((s) => {
      const product = products.find((p) => p.id === s.productId);
      const vendor = vendors.find((v) => v.id === s.vendorId);
      // Profit = Selling - Cost
      const marginAmount = s.sellingPrice - s.costPrice;

      return {
        ...s,
        productName: product ? product.name : "Unknown Item",
        vendorName: vendor ? vendor.name : "Unknown Vendor",
        marginAmount,
      };
    });

    // Filtering
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          item.productName.toLowerCase().includes(lower) ||
          item.vendorName.toLowerCase().includes(lower) ||
          item.purchaseOrderNumber.toLowerCase().includes(lower),
      );
    }
    if (dateFilter) {
      data = data.filter((item) => item.date === dateFilter);
    }

    // Sorting
    data.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a];
      const bVal = b[sortConfig.key as keyof typeof b];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [supplies, products, vendors, searchTerm, dateFilter, sortConfig]);

  const supplyToDeleteDetails = useMemo(() => {
    if (!supplyToDelete) return null;
    const supply = supplies.find((s) => s.id === supplyToDelete);
    if (!supply) return null;
    const product = products.find((p) => p.id === supply.productId);
    return { ...supply, productName: product?.name || "Unknown Item" };
  }, [supplyToDelete, supplies, products]);

  // --- Handlers ---

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Supply Management Handlers
  // const formValue = useStore(supplyForm.store, (state) => state.values);

  const handleCostChange = (cost: number) => {
    const current = supplyForm.state.values;
    const profit = current.sellingPrice - cost;
    supplyForm.setFieldValue("costPrice", cost);
    supplyForm.setFieldValue("profit", parseFloat(profit.toFixed(2)));
  };

  const handleProfitChange = (profit: number) => {
    const current = supplyForm.state.values;
    const selling = current.costPrice + profit;
    supplyForm.setFieldValue("profit", profit);
    supplyForm.setFieldValue("sellingPrice", parseFloat(selling.toFixed(2)));
  };

  const handleSellingChange = (selling: number) => {
    const current = supplyForm.state.values;
    const profit = selling - current.costPrice;
    supplyForm.setFieldValue("sellingPrice", selling);
    supplyForm.setFieldValue("profit", parseFloat(profit.toFixed(2)));
  };

  const selectExistingProduct = (p: Product) => {
    const profit = p.sellingPrice - p.costPrice;
    supplyForm.setFieldValue("productId", p.id);
    supplyForm.setFieldValue("itemName", p.name);
    supplyForm.setFieldValue("costPrice", p.costPrice);
    supplyForm.setFieldValue("sellingPrice", p.sellingPrice);
    supplyForm.setFieldValue("profit", parseFloat(profit.toFixed(2)));
    supplyForm.setFieldValue("lowStockThreshold", p.lowStockThreshold ?? 10);
  };

  const selectExistingVendor = (v: Vendor) => {
    supplyForm.setFieldValue("vendorId", v.id);
    supplyForm.setFieldValue("vendorName", v.name);
  };

  const openNewSupply = () => {
    setEditingSupplyId(null);
    supplyForm.reset({
      ...initialSupplyForm,
      date: getLocalDateStr(),
      purchaseOrder: generatePO(),
    });
    setIsSupplyModalOpen(true);
  };

  const openBulkSupply = () => {
    setBulkPreview([]);
    setBulkError(null);
    setIsBulkSupplyModalOpen(true);
  };

  const closeBulkSupply = () => {
    setIsBulkSupplyModalOpen(false);
    setBulkPreview([]);
    setBulkError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openEditSupply = (entry: any) => {
    setEditingSupplyId(entry.id);
    const profit = entry.sellingPrice - entry.costPrice;
    const product = products.find((p) => p.id === entry.productId);

    supplyForm.reset({
      date: entry.date,
      vendorId: entry.vendorId,
      vendorName: entry.vendorName ?? "",
      itemName: entry.productName,
      productId: entry.productId,
      quantity: entry.quantity,
      costPrice: entry.costPrice,
      sellingPrice: entry.sellingPrice,
      profit: parseFloat(profit.toFixed(2)),
      purchaseOrder: entry.purchaseOrderNumber ?? "",
      lowStockThreshold: product?.lowStockThreshold ?? 10,
    });

    setIsSupplyModalOpen(true);
  };

  const handleDeleteSupply = (id: string) => {
    setSupplyToDelete(id);
  };

  const confirmDeleteSupply = () => {
    if (supplyToDelete) {
      deleteSupplyEntryMutation.mutate(
        { id: supplyToDelete },
        {
          onSuccess: () => {
            toast.success("Supply record deleted successfully");
            setSupplyToDelete(null);
          },
          onError: (e) =>
            toast.error(e instanceof Error ? e.message : "Failed to delete"),
        },
      );
    }
  };

  const closeSupplyModal = () => {
    setIsSupplyModalOpen(false);
    setEditingSupplyId(null);
    supplyForm.reset();
  };

  // --- Bulk Supply File Handler ---

  const downloadTemplate = () => {
    const headers = [
      [
        "Date (YYYY-MM-DD)",
        "Vendor Name",
        "Item Name",
        "Quantity",
        "Cost Price",
        "Selling Price",
      ],
    ];
    const example = [
      [getLocalDateStr(), "Example Vendor", "Example Product", 10, 500, 750],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Supply_Upload_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // Read as array of arrays first to check headers, or direct to JSON
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length < 2) {
          setBulkError("File appears to be empty or missing headers.");
          setBulkPreview([]);
          return;
        }

        // Map data to objects (assuming order or rough header match)
        // Expected: Date, Vendor, Item, Qty, Cost, Sell
        // We'll skip row 0 (headers)
        const rows = data
          .slice(1)
          .map((row, idx) => {
            // row indices: 0: Date, 1: Vendor, 2: Item, 3: Qty, 4: Cost, 5: Sell
            return {
              tempId: idx,
              date: row[0] || getLocalDateStr(),
              vendorName: row[1],
              itemName: row[2],
              quantity: Number(row[3]) || 0,
              costPrice: Number(row[4]) || 0,
              sellingPrice: Number(row[5]) || 0,
              poNumber: generatePO(), // Auto-generate PO number
              isValid: !!(
                row[1] &&
                row[2] &&
                Number(row[3]) > 0 &&
                Number(row[4]) >= 0 &&
                Number(row[5]) >= 0
              ),
            };
          })
          .filter((r) => r.vendorName || r.itemName); // Filter totally empty rows

        setBulkPreview(rows);
        setBulkError(null);
      } catch (err) {
        console.error(err);
        setBulkError(
          "Failed to parse file. Please ensure it is a valid Excel or CSV file.",
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const processBulkUpload = async () => {
    if (bulkPreview.length === 0) return;
    setIsProcessingBulk(true);
    setBulkError(null);

    try {
      const validRows = bulkPreview.filter((r) => r.isValid);
      const currentVendors = [...vendors];
      const currentProducts = [...products];

      for (let idx = 0; idx < validRows.length; idx++) {
        const row = validRows[idx]!;
        let finalVendorId: string;
        const vendorMatch = currentVendors.find(
          (v) => v.name.toLowerCase() === row.vendorName.trim().toLowerCase(),
        );
        if (vendorMatch) {
          finalVendorId = vendorMatch.id;
        } else {
          const created = await createVendorMutation.mutateAsync({
            name: row.vendorName.trim(),
            contact: "-",
            email: "noreply@vendor.local",
          });
          finalVendorId = created.id;
          currentVendors.push(created);
        }

        let finalProductId: string;
        const productMatch = currentProducts.find(
          (p) => p.name.toLowerCase() === row.itemName.trim().toLowerCase(),
        );
        if (productMatch) {
          finalProductId = productMatch.id;
        } else {
          const created = await createProductMutation.mutateAsync({
            name: row.itemName.trim(),
            costPrice: row.costPrice,
            sellingPrice: row.sellingPrice,
            stock: 0,
            vendorId: finalVendorId,
          });
          finalProductId = created.id;
          currentProducts.push(created);
        }

        await createSupplyEntryMutation.mutateAsync({
          date: row.date,
          vendorId: finalVendorId,
          productId: finalProductId,
          quantity: row.quantity,
          costPrice: row.costPrice,
          sellingPrice: row.sellingPrice,
          purchaseOrderNumber: row.poNumber,
          isPaid: false,
        });
      }

      closeBulkSupply();
      toast.success(`Successfully processed ${validRows.length} records.`);
    } catch (e) {
      setBulkError("Error processing records. Please try again.");
      console.error(e);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // --- Bulk Vendor Upload Handlers ---
  const openBulkVendor = () => {
    setBulkVendorPreview([]);
    setBulkVendorError(null);
    setIsBulkVendorModalOpen(true);
  };

  const closeBulkVendor = () => {
    setIsBulkVendorModalOpen(false);
    setBulkVendorPreview([]);
    setBulkVendorError(null);
    if (vendorFileInputRef.current) vendorFileInputRef.current.value = "";
  };

  const downloadVendorTemplate = () => {
    const headers = [["Vendor Name", "Contact Phone", "Email Address"]];
    const example = [
      [
        "Global Supplies Ltd",
        "+234 800 000 0000",
        "contact@globalsupplies.com",
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Vendor_Upload_Template.xlsx");
  };

  const handleVendorFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length < 2) {
          setBulkVendorError("File appears to be empty or missing headers.");
          setBulkVendorPreview([]);
          return;
        }

        // Expected: Name, Phone, Email
        const rows = data
          .slice(1)
          .map((row, idx) => {
            return {
              tempId: idx,
              name: row[0],
              contact: row[1] || "",
              email: row[2] || "",
              isValid: !!row[0], // Only name is strictly required
            };
          })
          .filter((r) => r.name);

        setBulkVendorPreview(rows);
        setBulkVendorError(null);
      } catch (err) {
        console.error(err);
        setBulkVendorError(
          "Failed to parse file. Please ensure it is a valid Excel or CSV file.",
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const processBulkVendorUpload = async () => {
    if (bulkVendorPreview.length === 0) return;
    setIsProcessingBulkVendors(true);
    setBulkVendorError(null);

    try {
      const validRows = bulkVendorPreview.filter((r) => r.isValid);
      let addedCount = 0;

      for (const row of validRows) {
        const exists = vendors.find(
          (v) => v.name.toLowerCase() === row.name.trim().toLowerCase(),
        );
        if (!exists) {
          await createVendorMutation.mutateAsync({
            name: row.name.trim(),
            contact: row.contact?.trim() || "-",
            email: row.email?.trim() || "noreply@vendor.local",
          });
          addedCount++;
        }
      }

      closeBulkVendor();
      toast.success(`Process complete. Added ${addedCount} new vendors.`);
    } catch (e) {
      setBulkVendorError("Error processing records. Please try again.");
      console.error(e);
    } finally {
      setIsProcessingBulkVendors(false);
    }
  };

  // Vendor Management Handlers
  const openEditVendor = (v: Vendor) => {
    setEditingVendorId(v.id);
    vendorForm.reset({ name: v.name, contact: v.contact, email: v.email });
    setIsVendorModalOpen(true);
  };

  const handleDeleteVendor = (id: string) => {
    setVendorToDelete(id);
  };

  const confirmDeleteVendor = () => {
    if (vendorToDelete) {
      deleteVendorMutation.mutate(
        { id: vendorToDelete },
        {
          onSuccess: () => {
            toast.success("Vendor deleted successfully");
            if (selectedVendorId === vendorToDelete) setSelectedVendorId(null);
            setVendorToDelete(null);
          },
          onError: (e) =>
            toast.error(e instanceof Error ? e.message : "Failed to delete"),
        },
      );
    }
  };

  const closeVendorModal = () => {
    setIsVendorModalOpen(false);
    setEditingVendorId(null);
    vendorForm.reset();
  };

  const handleVendorRowClick = (vendorId: string) => {
    setSelectedVendorId(vendorId);
  };

  // --- DETAIL VIEW LOGIC ---
  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId),
    [vendors, selectedVendorId],
  );

  const selectedVendorSupplies = useMemo(() => {
    if (!selectedVendorId) return [];
    return supplies
      .filter((s) => s.vendorId === selectedVendorId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((s) => {
        const product = products.find((p) => p.id === s.productId);
        return {
          ...s,
          productName: product ? product.name : "Unknown Item",
        };
      });
  }, [supplies, products, selectedVendorId]);

  const vendorCOGS = useMemo(() => {
    if (!selectedVendorId) return 0;

    // Get all products for this vendor
    const vendorProductIds = new Set(
      products.filter((p) => p.vendorId === selectedVendorId).map((p) => p.id),
    );
    // Sum up cost of sold items (COGS)
    return t.data?.reduce((total, txn) => {
      const txnCost = txn.items.reduce((itemTotal, item) => {
        if (vendorProductIds.has(item.productId)) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            return itemTotal + item.quantity * product.costPrice;
          }
        }
        return itemTotal;
      }, 0);
      return total + txnCost;
    }, 0);
  }, [products, selectedVendorId]);

  return (
    <div className="relative h-full">
      {selectedVendorId && selectedVendor ? (
        // --- DETAIL VIEW ---
        <div className="flex h-full animate-in flex-col gap-6 duration-200 fade-in">
          {/* Header */}
          <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedVendorId(null)}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Vendor Profile</h2>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-3">
            {/* SECTION 1: Vendor Information */}
            <div className="h-fit rounded-lg bg-white p-6 shadow-sm md:col-span-1">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-2xl font-bold text-pink-600">
                  {selectedVendor.name.charAt(0)}
                </div>
                <button
                  type="button"
                  onClick={() => openEditVendor(selectedVendor)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-600"
                >
                  <Edit2 size={18} />
                </button>
              </div>

              <h3 className="mb-1 text-xl font-bold text-gray-900">
                {selectedVendor.name}
              </h3>
              <p className="mb-6 font-mono text-sm text-gray-400">
                ID: {selectedVendor.id}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-medium">
                      {selectedVendor.contact || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-medium">
                      {selectedVendor.email || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Last Supplied</p>
                    <p className="font-medium">
                      {selectedVendorSupplies.length > 0
                        ? selectedVendorSupplies[0].date
                        : "No History"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Supply History Table */}
            <div className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm md:col-span-2">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4">
                <h3 className="flex items-center gap-2 font-bold text-gray-800">
                  <Package size={18} className="text-pink-600" /> Supply History
                  <span className="ml-4 hidden rounded border border-gray-200 bg-white px-2 py-1 text-xs font-normal text-gray-500 shadow-sm md:inline-block">
                    Total COGS:{" "}
                    <span className="font-bold text-gray-900">
                      ₦
                      {vendorCOGS?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </span>
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openBulkSupply}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-50"
                  >
                    <Layers size={14} /> Bulk Supply
                  </button>
                  <button
                    type="button"
                    onClick={openNewSupply}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-50"
                  >
                    <Plus size={14} /> Add New
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-700 uppercase">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Item Name</th>
                      <th className="px-6 py-3 text-center">Qty</th>
                      <th className="px-6 py-3 text-right">Cost Price</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVendorSupplies.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-400"
                        >
                          No supply history recorded for this vendor.
                        </td>
                      </tr>
                    ) : (
                      selectedVendorSupplies.map((supply) => (
                        <tr
                          key={supply.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-6 py-3">{supply.date}</td>
                          <td className="px-6 py-3 font-medium text-gray-800">
                            {supply.productName}
                            {supply.purchaseOrderNumber && (
                              <span className="block text-xs text-gray-400">
                                {supply.purchaseOrderNumber}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-center font-medium text-gray-900">
                            {supply.quantity}
                          </td>
                          <td className="px-6 py-3 text-right font-mono">
                            ₦{supply.costPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteSupply(supply.id)}
                              className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- LIST VIEW (Original Content) ---
        <div className="flex h-full flex-col gap-4">
          {/* 1. Header Box */}
          <div className="flex shrink-0 flex-col items-start justify-between rounded-lg bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Vendor & Supply Management
              </h2>
              <p className="text-sm text-gray-500">
                Track inventory purchases and supplier details
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              {activeTab === "supplies" ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={openBulkSupply}
                    className="flex items-center gap-2 rounded-lg bg-pink-100 px-4 py-2 font-medium text-pink-700 shadow-sm transition-colors hover:bg-pink-200"
                  >
                    <Layers size={18} /> Bulk Supply
                  </button>
                  <button
                    type="button"
                    onClick={openNewSupply}
                    className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
                  >
                    <Plus size={18} /> Record Supply
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={openBulkVendor}
                    className="flex items-center gap-2 rounded-lg bg-pink-100 px-4 py-2 font-medium text-pink-700 shadow-sm transition-colors hover:bg-pink-200"
                  >
                    <Layers size={18} /> Bulk Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVendorId(null);
                      vendorForm.reset(initialVendorForm);
                      setIsVendorModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-pink-700"
                  >
                    <Plus size={18} /> Add New Vendor
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. Tabs and Content Box */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
            {/* Navigation Tabs */}
            <div className="flex gap-8 border-b border-gray-100 px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("supplies")}
                className={`py-4 text-sm font-medium transition-all border-b-2 px-1 ${
                  activeTab === "supplies"
                    ? "border-pink-600 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Supply Log
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vendors")}
                className={`py-4 text-sm font-medium transition-all border-b-2 px-1 ${
                  activeTab === "vendors"
                    ? "border-pink-600 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Vendor Directory
              </button>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {activeTab === "supplies" ? (
                <div className="flex h-full flex-col">
                  {/* Filters - integrated into the top of the content */}
                  <div className="flex flex-col gap-4 border-b border-gray-100 p-4 md:flex-row">
                    <div className="relative flex-1">
                      <Search
                        className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        placeholder="Search by Item, Vendor or PO#..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-500" />
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      {dateFilter && (
                        <button
                          type="button"
                          onClick={() => setDateFilter("")}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Supply History Table */}
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                      <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-700 uppercase shadow-sm">
                        <tr>
                          {[
                            { label: "Date", key: "date" },
                            { label: "Vendor", key: "vendorName" },
                            { label: "Item", key: "productName" },
                            {
                              label: "Qty",
                              key: "quantity",
                              align: "text-center",
                            },
                            {
                              label: "Cost Price",
                              key: "costPrice",
                              align: "text-right",
                            },
                          ].map((col) => (
                            <th
                              key={col.key}
                              className={`px-6 py-4 cursor-pointer hover:bg-gray-100 ${col.align || ""}`}
                              onClick={() => handleSort(col.key)}
                            >
                              <div
                                className={`flex items-center gap-1 ${col.align === "text-right" ? "justify-end" : col.align === "text-center" ? "justify-center" : ""}`}
                              >
                                {col.label}
                              </div>
                            </th>
                          ))}
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-6 py-10 text-center text-gray-400"
                            >
                              No supply records found.
                            </td>
                          </tr>
                        ) : (
                          tableData.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b bg-white transition-colors hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 font-medium whitespace-nowrap text-gray-900">
                                {row.date}
                                {row.purchaseOrderNumber && (
                                  <div className="text-xs text-gray-400">
                                    PO: {row.purchaseOrderNumber}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">{row.vendorName}</td>
                              <td className="px-6 py-4 font-medium text-gray-800">
                                {row.productName}
                              </td>
                              <td className="px-6 py-4 text-center font-medium text-gray-900">
                                {row.quantity}
                              </td>
                              <td className="px-6 py-4 text-right font-mono">
                                ₦{row.costPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditSupply(row)}
                                    className="rounded p-1.5 text-pink-600 transition-colors hover:bg-pink-50"
                                    title="Edit Record"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSupply(row.id)}
                                    className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                    title="Delete Record"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                      <thead className="sticky top-0 z-10 bg-gray-50 text-xs text-gray-700 uppercase shadow-sm">
                        <tr>
                          <th className="px-6 py-4">Vendor Name</th>
                          <th className="px-6 py-4">Phone</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map((v) => {
                          return (
                            <tr
                              key={v.id}
                              onClick={() => handleVendorRowClick(v.id)}
                              className="group cursor-pointer border-b bg-white transition-colors hover:bg-pink-50"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-bold text-gray-800">
                                    {v.name}
                                  </p>
                                  <div className="text-xs text-gray-400">
                                    ID: {v.id}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">{v.contact}</td>
                              <td className="px-6 py-4">{v.email}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVendorRowClick(v.id);
                                    }}
                                    className="rounded p-1.5 text-pink-600 transition-colors hover:bg-pink-100"
                                    title="View Details"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteVendor(v.id);
                                    }}
                                    className="rounded p-1.5 text-red-600 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-100"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Empty State Help Card */}
                    {vendors.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                        <Users size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">No vendors found</p>
                        <p className="text-sm">
                          Click "Add New Vendor" to get started
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Add/Edit Supply Modal --- */}
      {isSupplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl animate-in overflow-y-auto rounded-xl bg-white shadow-2xl duration-200 zoom-in">
            <div className="flex items-center justify-between border-b bg-gray-50 p-6">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Package className="text-pink-600" />{" "}
                {editingSupplyId ? "Edit Supply Record" : "Record New Supply"}
              </h3>
              <button
                type="button"
                onClick={closeSupplyModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                supplyForm.handleSubmit();
              }}
              className="space-y-6 p-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <supplyForm.Field name="date">
                  {(field) => (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="w-full rounded-md border p-2"
                      />
                      <FormError field={field} />
                    </div>
                  )}
                </supplyForm.Field>
                <supplyForm.Field name="purchaseOrder">
                  {(field) => (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Purchase Order
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={field.state.value}
                        className="w-full cursor-not-allowed rounded-md border bg-gray-100 p-2 text-gray-500"
                      />
                    </div>
                  )}
                </supplyForm.Field>
              </div>

              <div>
                <supplyForm.Field name="vendorName">
                  {(field) => (
                    <>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Vendor Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          autoComplete="off"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            supplyForm.setFieldValue("vendorId", "");
                          }}
                          className="w-full rounded-md border p-2"
                          placeholder="Enter vendor name..."
                        />
                        <supplyForm.Subscribe
                          selector={(state) => [
                            state.values.vendorName,
                            state.values.vendorId,
                          ]}
                        >
                          {([vendorName, vendorId]) => {
                            const matches =
                              !vendorName || vendorId
                                ? []
                                : vendors.filter((v) =>
                                    v.name
                                      .toLowerCase()
                                      .includes(vendorName.toLowerCase()),
                                  );

                            if (matches.length === 0) return null;

                            return (
                              <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                {matches.map((v) => (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => selectExistingVendor(v)}
                                    className="group flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-100"
                                  >
                                    <span className="font-medium text-gray-800">
                                      {v.name}
                                    </span>
                                    <span className="text-xs text-gray-400 group-hover:text-pink-500">
                                      Use Existing
                                    </span>
                                  </button>
                                ))}
                              </div>
                            );
                          }}
                        </supplyForm.Subscribe>
                      </div>
                      <FormError field={field} />
                    </>
                  )}
                </supplyForm.Field>
                <supplyForm.Subscribe
                  selector={(state) => state.values.vendorId}
                >
                  {(vendorId) =>
                    vendorId ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={12} /> Linked to existing vendor
                        database
                      </p>
                    ) : null
                  }
                </supplyForm.Subscribe>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <supplyForm.Field name="itemName">
                  {(field) => (
                    <div className="relative">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Item Supplied
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="Search existing or enter new product name..."
                        value={field.state.value}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          supplyForm.setFieldValue("productId", "");
                        }}
                        className="w-full rounded-md border p-2"
                      />
                      <supplyForm.Subscribe
                        selector={(state) => [
                          state.values.itemName,
                          state.values.productId,
                        ]}
                      >
                        {([itemName, productId]) => {
                          const matches =
                            editingSupplyId || !itemName || productId
                              ? []
                              : products.filter((p) =>
                                  p.name
                                    .toLowerCase()
                                    .includes(itemName.toLowerCase()),
                                );

                          if (matches.length === 0) return null;

                          return (
                            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                              {matches.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() =>
                                    selectExistingProduct(p as Product)
                                  }
                                  className="group flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-100"
                                >
                                  <span className="font-medium text-gray-800">
                                    {p.name}
                                  </span>
                                  <span className="text-xs text-gray-400 group-hover:text-pink-500">
                                    Use Existing
                                  </span>
                                </button>
                              ))}
                            </div>
                          );
                        }}
                      </supplyForm.Subscribe>
                      <FormError field={field} />
                    </div>
                  )}
                </supplyForm.Field>
                <supplyForm.Subscribe
                  selector={(state) => state.values.productId}
                >
                  {(productId) =>
                    productId ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={12} /> Linked to existing product
                        database
                      </p>
                    ) : null
                  }
                </supplyForm.Subscribe>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <supplyForm.Field name="quantity">
                      {(field) => (
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(parseInt(e.target.value) || 0)
                            }
                            className="w-full rounded-md border p-2 text-lg font-bold"
                          />
                          <FormError field={field} />
                        </div>
                      )}
                    </supplyForm.Field>
                    <supplyForm.Field name="lowStockThreshold">
                      {(field) => (
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Low Stock Alert Level
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(parseInt(e.target.value) || 0)
                            }
                            className="w-full rounded-md border p-2 text-gray-600"
                            placeholder="Default: 10"
                          />
                        </div>
                      )}
                    </supplyForm.Field>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-end gap-4">
                  <supplyForm.Field name="costPrice">
                    {(field) => (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Cost Price (₦)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={field.state.value}
                          onChange={(e) =>
                            handleCostChange(parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-md border p-2"
                        />
                        <FormError field={field} />
                      </div>
                    )}
                  </supplyForm.Field>
                  <supplyForm.Field name="profit">
                    {(field) => (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Profit (₦)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={field.state.value}
                          onChange={(e) =>
                            handleProfitChange(parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-md border p-2 font-medium text-green-600"
                        />
                      </div>
                    )}
                  </supplyForm.Field>
                  <supplyForm.Field name="sellingPrice">
                    {(field) => (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Selling Price (₦)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={field.state.value}
                          onChange={(e) =>
                            handleSellingChange(parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-md border p-2 font-bold"
                        />
                        <FormError field={field} />
                      </div>
                    )}
                  </supplyForm.Field>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSupplyModal}
                  className="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <supplyForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <button
                      disabled={!canSubmit || isSubmitting || isPending}
                      type="submit"
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 py-3 font-bold text-white shadow-md hover:bg-pink-700"
                    >
                      {editingSupplyId
                        ? "Update Record"
                        : "Confirm Supply Entry"}
                      <Activity mode={isPending ? "visible" : "hidden"}>
                        <LoaderCircle className="animate-spin" size={18} />
                      </Activity>
                    </button>
                  )}
                </supplyForm.Subscribe>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Bulk Supply Upload Modal --- */}
      {isBulkSupplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[90vh] w-full max-w-5xl animate-in flex-col rounded-xl bg-white shadow-2xl duration-200 zoom-in">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b bg-gray-50 p-6">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <Layers className="text-pink-600" /> Bulk Supply Import
                </h3>
                <p className="text-sm text-gray-500">
                  Upload Excel or CSV file to import multiple supply records.
                </p>
              </div>
              <button
                type="button"
                onClick={closeBulkSupply}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col overflow-hidden p-6">
              {/* 1. Upload Section */}
              <div className="group relative mb-6 flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-pink-300 hover:bg-pink-50">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm transition-transform group-hover:scale-110">
                  <Upload size={32} />
                </div>
                <h4 className="mb-1 text-lg font-bold text-gray-800">
                  Click to Upload or Drag File Here
                </h4>
                <p className="mb-4 text-sm text-gray-500">
                  Supports .xlsx, .xls, .csv
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadTemplate();
                  }}
                  className="relative z-10 flex items-center gap-2 text-sm font-medium text-pink-600 hover:underline"
                >
                  <Download size={14} /> Download Template File
                </button>
              </div>

              {/* 2. Error Message */}
              {bulkError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  <AlertCircle size={20} /> {bulkError}
                </div>
              )}

              {/* 3. Preview Table */}
              {bulkPreview.length > 0 && (
                <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-3">
                    <h4 className="flex items-center gap-2 font-bold text-gray-700">
                      <FileSpreadsheet size={16} /> Data Preview
                    </h4>
                    <span className="text-xs text-gray-500">
                      {bulkPreview.length} rows found
                    </span>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Vendor</th>
                          <th className="px-4 py-2">Item</th>
                          <th className="px-4 py-2 text-right">Qty</th>
                          <th className="px-4 py-2 text-right">Cost</th>
                          <th className="px-4 py-2 text-right">Sell</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bulkPreview.map((row, idx) => (
                          <tr
                            key={crypto.randomUUID()}
                            className={
                              row.isValid
                                ? "hover:bg-gray-50"
                                : "bg-red-50 hover:bg-red-100"
                            }
                          >
                            <td className="px-4 py-2">
                              {row.isValid ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                  <CheckCircle size={12} /> Valid
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                  <AlertTriangle size={12} /> Invalid
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {row.date}
                            </td>
                            <td className="px-4 py-2">
                              {row.vendorName || (
                                <span className="text-red-400 italic">
                                  Missing
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {row.itemName || (
                                <span className="text-red-400 italic">
                                  Missing
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {row.quantity}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {row.costPrice}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {row.sellingPrice}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 gap-4 border-t bg-gray-50 p-6">
              <button
                type="button"
                onClick={closeBulkSupply}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <div className="flex flex-1 items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={processBulkUpload}
                  disabled={
                    bulkPreview.filter((r) => r.isValid).length === 0 ||
                    isProcessingBulk
                  }
                  className="flex items-center gap-2 rounded-lg bg-pink-600 px-8 py-3 font-bold text-white shadow-lg hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isProcessingBulk
                    ? "Processing..."
                    : `Import ${bulkPreview.filter((r) => r.isValid).length} Records`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Bulk Vendor Upload Modal --- */}
      {isBulkVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[90vh] w-full max-w-5xl animate-in flex-col rounded-xl bg-white shadow-2xl duration-200 zoom-in">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b bg-gray-50 p-6">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <Layers className="text-pink-600" /> Bulk Vendor Import
                </h3>
                <p className="text-sm text-gray-500">
                  Upload Excel or CSV file to import multiple vendors.
                </p>
              </div>
              <button
                type="button"
                onClick={closeBulkVendor}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col overflow-hidden p-6">
              {/* 1. Upload Section */}
              <div className="group relative mb-6 flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-pink-300 hover:bg-pink-50">
                <input
                  type="file"
                  ref={vendorFileInputRef}
                  accept=".csv, .xlsx, .xls"
                  onChange={handleVendorFileUpload}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm transition-transform group-hover:scale-110">
                  <Upload size={32} />
                </div>
                <h4 className="mb-1 text-lg font-bold text-gray-800">
                  Click to Upload or Drag File Here
                </h4>
                <p className="mb-4 text-sm text-gray-500">
                  Supports .xlsx, .xls, .csv
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadVendorTemplate();
                  }}
                  className="relative z-10 flex items-center gap-2 text-sm font-medium text-pink-600 hover:underline"
                >
                  <Download size={14} /> Download Template File
                </button>
              </div>

              {/* 2. Error Message */}
              {bulkVendorError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  <AlertCircle size={20} /> {bulkVendorError}
                </div>
              )}

              {/* 3. Preview Table */}
              {bulkVendorPreview.length > 0 && (
                <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-3">
                    <h4 className="flex items-center gap-2 font-bold text-gray-700">
                      <FileSpreadsheet size={16} /> Data Preview
                    </h4>
                    <span className="text-xs text-gray-500">
                      {bulkVendorPreview.length} rows found
                    </span>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2">Vendor Name</th>
                          <th className="px-4 py-2">Contact Phone</th>
                          <th className="px-4 py-2">Email Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bulkVendorPreview.map((row, idx) => (
                          <tr
                            key={crypto.randomUUID()}
                            className={
                              row.isValid
                                ? "hover:bg-gray-50"
                                : "bg-red-50 hover:bg-red-100"
                            }
                          >
                            <td className="px-4 py-2">
                              {row.isValid ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                  <CheckCircle size={12} /> Valid
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                                  <AlertTriangle size={12} /> Invalid
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {row.name || (
                                <span className="text-red-400 italic">
                                  Missing
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">{row.contact}</td>
                            <td className="px-4 py-2">{row.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 gap-4 border-t bg-gray-50 p-6">
              <button
                type="button"
                onClick={closeBulkVendor}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <div className="flex flex-1 items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={processBulkVendorUpload}
                  disabled={
                    bulkVendorPreview.filter((r) => r.isValid).length === 0 ||
                    isProcessingBulkVendors
                  }
                  className="flex items-center gap-2 rounded-lg bg-pink-600 px-8 py-3 font-bold text-white shadow-lg hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isProcessingBulkVendors
                    ? "Processing..."
                    : `Import ${bulkVendorPreview.filter((r) => r.isValid).length} Vendors`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Add/Edit Vendor Modal --- */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md animate-in overflow-y-auto rounded-xl bg-white shadow-2xl duration-200 zoom-in">
            <div className="flex items-center justify-between border-b bg-gray-50 p-6">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Users className="text-pink-600" />{" "}
                {editingVendorId ? "Edit Vendor Details" : "Add New Vendor"}
              </h3>
              <button
                type="button"
                onClick={closeVendorModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                vendorForm.handleSubmit();
              }}
              className="space-y-4 p-6"
            >
              <vendorForm.Field name="name">
                {(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-md border p-2 outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. Global Supplies Ltd"
                    />
                    <FormError field={field} />
                  </div>
                )}
              </vendorForm.Field>
              <vendorForm.Field name="contact">
                {(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-md border p-2 outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. +234 800..."
                    />
                    <FormError field={field} />
                  </div>
                )}
              </vendorForm.Field>
              <vendorForm.Field name="email">
                {(field) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-md border p-2 outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. contact@vendor.com"
                    />
                    <FormError field={field} />
                  </div>
                )}
              </vendorForm.Field>
              <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeVendorModal}
                  className="flex-1 rounded-lg bg-gray-100 py-2 font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <vendorForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => {
                    return (
                      <button
                        disabled={!canSubmit || isSubmitting || isPending}
                        type="submit"
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 py-2 font-medium text-white shadow-sm hover:bg-pink-700"
                      >
                        {editingVendorId ? "Update Vendor" : "Save Vendor"}
                        <Activity mode={isPending ? "visible" : "hidden"}>
                          <LoaderCircle className="animate-spin" size={18} />
                        </Activity>
                      </button>
                    );
                  }}
                </vendorForm.Subscribe>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Supply Confirmation Modal --- */}
      {supplyToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm animate-in overflow-hidden rounded-xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Delete Supply Record?
              </h3>
              <p className="mb-6 text-gray-500">
                Are you sure you want to delete this supply record?{" "}
                {supplyToDeleteDetails && (
                  <span className="font-bold">
                    ({supplyToDeleteDetails.productName})
                  </span>
                )}{" "}
                <br />
                <span className="text-sm font-medium text-red-500">
                  This will adjust stock levels.
                </span>
              </p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setSupplyToDelete(null)}
                  className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSupply}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Vendor Confirmation Modal --- */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm animate-in overflow-hidden rounded-xl bg-white p-6 shadow-2xl duration-200 fade-in zoom-in">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Delete Vendor?
              </h3>
              <p className="mb-6 text-gray-500">
                Are you sure you want to delete this vendor? <br />
                <span className="text-sm font-medium text-red-500">
                  This action cannot be undone.
                </span>
              </p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setVendorToDelete(null)}
                  className="flex-1 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteVendor}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPage;
