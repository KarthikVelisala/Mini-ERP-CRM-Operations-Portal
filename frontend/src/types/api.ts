export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type Permission =
  | 'customer:read'
  | 'customer:write'
  | 'followup:write'
  | 'product:read'
  | 'product:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'challan:read'
  | 'challan:write'
  | 'challan:confirm'
  | 'challan:cancel';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFieldError {
  source: string;
  field: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiFieldError[] | Record<string, unknown>;
  };
}

export interface UserRef {
  id: string;
  name: string;
  role?: Role;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string | null;
  type: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: UserRef;
  _count?: { followUps: number; challans: number };
}

export interface FollowUp {
  id: string;
  note: string;
  followUpDate: string | null;
  createdAt: string;
  createdBy: UserRef;
}

export interface CustomerDetail extends Customer {
  followUps: FollowUp[];
  challans: Array<{
    id: string;
    challanNumber: string;
    status: ChallanStatus;
    totalQuantity: number;
    totalAmount: number;
    createdAt: string;
  }>;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockValue: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface StockMovement {
  id: string;
  type: MovementType;
  quantity: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
  product: { id: string; name: string; sku: string; category?: string; location?: string };
  challan: { id: string; challanNumber: string; status?: ChallanStatus } | null;
  createdBy: UserRef;
}

export interface ProductDetail extends Product {
  createdBy: UserRef;
  stockMovements: Array<Omit<StockMovement, 'product' | 'challan'> & {
    challan: { id: string; challanNumber: string } | null;
  }>;
}

export interface ChallanItem {
  id: string;
  productId: string | null;
  productName: string;
  productSku: string;
  productCategory: string;
  productLocation: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount: number;
  notes: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    businessName: string;
    mobile: string;
    email: string;
    type: CustomerType;
    gstNumber: string | null;
    address: string;
  };
  createdBy: UserRef;
  items: ChallanItem[];
}

export interface ChallanDetail extends Challan {
  stockMovements: Array<{
    id: string;
    type: MovementType;
    quantity: number;
    reason: string;
    balanceAfter: number;
    createdAt: string;
    product: { id: string; name: string; sku: string };
  }>;
}

export interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  stockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  today: { quantityIn: number; quantityOut: number };
}

export interface DashboardData {
  revenue: {
    current: number;
    previous: number;
    changeAmount: number;
    changePercent: number;
    challanCount: number;
    unitsDispatched: number;
    periodDays: number;
    periodStart: string;
    previousPeriodStart: string;
  };
  customers: {
    total: number;
    active: number;
    leads: number;
    inactive: number;
    followUpsDue: number;
  };
  challans: {
    draft: { count: number; value: number };
    confirmed: { count: number; value: number };
    cancelled: { count: number; value: number };
    total: number;
  };
  inventory: InventorySummary;
  topCustomers: Array<{
    id: string;
    name: string;
    businessName: string;
    type: CustomerType;
    status: CustomerStatus;
    revenue: number;
    challanCount: number;
    share: number;
  }>;
  topProducts: Array<{
    sku: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    label: string;
    revenue: number;
    quantity: number;
    challanCount: number;
  }>;
  salesPerformance: Array<{
    id: string;
    name: string;
    role: Role;
    revenue: number;
    quantity: number;
    challanCount: number;
    confirmed: number;
    draft: number;
    cancelled: number;
    conversionRate: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    location: string;
    currentStock: number;
    minStockAlert: number;
  }>;
  recentChallans: Array<{
    id: string;
    challanNumber: string;
    status: ChallanStatus;
    totalQuantity: number;
    totalAmount: number;
    createdAt: string;
    customer: { id: string; name: string; businessName: string };
    createdBy: UserRef;
  }>;
  upcomingFollowUps: Array<{
    id: string;
    name: string;
    businessName: string;
    mobile: string;
    status: CustomerStatus;
    followUpDate: string;
  }>;
}
