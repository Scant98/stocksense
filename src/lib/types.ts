export type StockStatus = "in_stock" | "low_stock" | "warning" | "out_of_stock";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  productsCount?: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  rating: number;
  totalOrders: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  categoryId: string;
  category: Category;
  supplierId?: string;
  supplier?: Supplier;
  quantity: number;
  reorderPoint: number;
  unitPrice: number;
  sellingPrice: number;
  description: string;
  image?: string;
  status: StockStatus;
  location?: string;
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  productId: string;
  product: Product;
  type: "purchase" | "sale" | "adjustment" | "return";
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reference: string;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod = "cash" | "mobile_money" | "card";

export interface SaleLine {
  id: string;
  productId: string;
  name: string;
  barcode?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
  amountPaid: number;
  change: number;
  customerName: string;
  cashierName: string;
  createdAt: string;
  items: SaleLine[];
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  status: InvoiceStatus;
  notes: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSalesThisMonth: number;
  totalPurchasesThisMonth: number;
  topCategory: string;
  recentTransactions: Transaction[];
}
