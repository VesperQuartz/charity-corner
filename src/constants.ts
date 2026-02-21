import {
  PaymentMethod,
  Product,
  SupplyEntry,
  Transaction,
  Vendor,
} from "./types";

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: "v1",
    name: "Global Supplies Ltd",
    contact: "+234 801 555 0101",
    email: "sales@globalsupplies.com",
  },
  {
    id: "v2",
    name: "Fresh Farms Inc",
    contact: "+234 802 555 0202",
    email: "orders@freshfarms.com",
  },
  {
    id: "v3",
    name: "Tech Distro",
    contact: "+234 803 555 0303",
    email: "partners@techdistro.com",
  },
  {
    id: "v5",
    name: "Beauty Wholesalers",
    contact: "+234 804 555 0404",
    email: "info@beautywholesalers.com",
  },
  {
    id: "v5",
    name: "Home Essentials Co",
    contact: "+234 805 555 0505",
    email: "support@homeessentials.com",
  },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_SUPPLIES: SupplyEntry[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
