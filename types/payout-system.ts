// TypeScript Types สำหรับระบบ 'ออกเงินให้ก่อนแล้วหัก 7%'

// =====================================================
// 1. User Role Types
// =====================================================

export type UserRole = 'MUSICIAN' | 'SHOP' | 'ADMIN';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  credits?: number;
  avatar_url?: string;
  province?: string;
  age?: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// 2. Gig Financial Types
// =====================================================

export type PaymentStatus = 'pending' | 'advanced_by_admin' | 'repaid';

export interface GigFinancialData {
  total_amount: number;      // ราคาเต็ม
  fee_amount: number;         // 7% ค่าธรรมเนียม
  musician_payout: number;   // 93% ยอดจ่ายให้นักดนตรี
  payment_status: PaymentStatus;
}

export interface Gig {
  id: string;
  title: string;
  description?: string;
  musician_id: string;
  shop_id: string;
  date: string;
  time?: string;
  location?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  
  // Financial data
  total_amount?: number;
  fee_amount?: number;
  musician_payout?: number;
  payment_status?: PaymentStatus;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  musician?: UserProfile;
  shop?: UserProfile;
  gig_logs?: GigLog[];
}

// =====================================================
// 3. Gig Log Types
// =====================================================

export interface GigLog {
  id: string;
  gig_id: string;
  evidence_photo_url?: string;
  check_in_location?: string;  // GPS coordinates or location description
  confirmed_at: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  gig?: Gig;
}

// =====================================================
// 4. API Request/Response Types
// =====================================================

export interface CreateGigRequest {
  title: string;
  description?: string;
  musician_id: string;
  shop_id: string;
  date: string;
  time?: string;
  location?: string;
  total_amount: number;  // Required for financial calculation
}

export interface UpdateGigFinancialRequest {
  total_amount: number;
}

export interface CreateGigLogRequest {
  gig_id: string;
  evidence_photo_url?: string;
  check_in_location?: string;
}

export interface UpdatePaymentStatusRequest {
  gig_id: string;
  payment_status: PaymentStatus;
}

// =====================================================
// 5. Financial Calculation Types
// =====================================================

export interface FinancialCalculation {
  total_amount: number;
  fee_rate: number;        // 0.07 (7%)
  fee_amount: number;
  payout_rate: number;     // 0.93 (93%)
  musician_payout: number;
}

export interface PayoutSummary {
  gig_id: string;
  gig_title: string;
  musician_name: string;
  shop_name: string;
  total_amount: number;
  fee_amount: number;
  musician_payout: number;
  payment_status: PaymentStatus;
  confirmed_at?: string;
}

// =====================================================
// 6. Dashboard & UI Types
// =====================================================

export interface MusicianDashboard {
  total_gigs: number;
  completed_gigs: number;
  total_earnings: number;
  pending_payouts: number;
  recent_gigs: Gig[];
}

export interface ShopDashboard {
  total_gigs: number;
  completed_gigs: number;
  total_spent: number;
  pending_payments: number;
  recent_gigs: Gig[];
}

export interface AdminDashboard {
  total_gigs: number;
  total_fees_collected: number;
  pending_advances: number;
  pending_repayments: number;
  recent_gigs: Gig[];
}

// =====================================================
// 7. Form Types
// =====================================================

export interface GigFinancialForm {
  total_amount: string;
  payment_status: PaymentStatus;
}

export interface GigLogForm {
  evidence_photo_url?: string;
  check_in_location?: string;
}

// =====================================================
// 8. Filter & Search Types
// =====================================================

export interface GigFilter {
  payment_status?: PaymentStatus;
  musician_id?: string;
  shop_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface GigSort {
  field: 'created_at' | 'updated_at' | 'total_amount' | 'confirmed_at';
  order: 'asc' | 'desc';
}

export interface GigSearchParams {
  filter?: GigFilter;
  sort?: GigSort;
  page?: number;
  limit?: number;
}

// =====================================================
// 9. Error Types
// =====================================================

export interface PayoutError {
  code: string;
  message: string;
  details?: any;
}

export type PayoutErrorCode = 
  | 'INSUFFICIENT_PERMISSIONS'
  | 'GIG_NOT_FOUND'
  | 'INVALID_AMOUNT'
  | 'INVALID_PAYMENT_STATUS'
  | 'PAYMENT_ALREADY_PROCESSED'
  | 'EVIDENCE_REQUIRED'
  | 'LOCATION_REQUIRED'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR';

// =====================================================
// 10. Constants
// =====================================================

export const FEE_RATE = 0.05;  // 5%
export const PAYOUT_RATE = 0.95;  // 95%

export const USER_ROLES = {
  MUSICIAN: 'MUSICIAN' as const,
  SHOP: 'SHOP' as const,
  ADMIN: 'ADMIN' as const
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending' as const,
  ADVANCED_BY_ADMIN: 'advanced_by_admin' as const,
  REPAID: 'repaid' as const
} as const;

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUSES.PENDING]: 'รอจ่าย',
  [PAYMENT_STATUSES.ADVANCED_BY_ADMIN]: 'ออกเงินก่อน',
  [PAYMENT_STATUSES.REPAID]: 'จ่ายคืนแล้ว'
} as const;

export const USER_ROLE_LABELS = {
  [USER_ROLES.MUSICIAN]: 'นักดนตรี',
  [USER_ROLES.SHOP]: 'ร้าน',
  [USER_ROLES.ADMIN]: 'ผู้ดูแลระบบ'
} as const;

// =====================================================
// 11. Utility Functions
// =====================================================

export const calculateFinancialData = (totalAmount: number): FinancialCalculation => {
  const fee_amount = totalAmount * FEE_RATE;
  const musician_payout = totalAmount * PAYOUT_RATE;
  
  return {
    total_amount: totalAmount,
    fee_rate: FEE_RATE,
    fee_amount,
    payout_rate: PAYOUT_RATE,
    musician_payout
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount);
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_LABELS[status] || status;
};

export const getUserRoleLabel = (role: UserRole): string => {
  return USER_ROLE_LABELS[role] || role;
};

export const validateGigFinancialData = (data: Partial<GigFinancialData>): string[] => {
  const errors: string[] = [];
  
  if (data.total_amount !== undefined && data.total_amount <= 0) {
    errors.push('ราคาต้องมากกว่า 0');
  }
  
  if (data.fee_amount !== undefined && data.fee_amount < 0) {
    errors.push('ค่าธรรมเนียมต้องไม่ติดลบ');
  }
  
  if (data.musician_payout !== undefined && data.musician_payout < 0) {
    errors.push('ยอดจ่ายต้องไม่ติดลบ');
  }
  
  if (data.total_amount && data.fee_amount && data.musician_payout) {
    const expectedFee = data.total_amount * FEE_RATE;
    const expectedPayout = data.total_amount * PAYOUT_RATE;
    
    if (Math.abs(data.fee_amount - expectedFee) > 0.01) {
      errors.push('ค่าธรรมเนียมไม่ถูกต้อง (ควรเป็น 5%)');
    }
    
    if (Math.abs(data.musician_payout - expectedPayout) > 0.01) {
      errors.push('ยอดจ่ายไม่ถูกต้อง (ควรเป็น 95%)');
    }
  }
  
  return errors;
};

// =====================================================
// 12. API Response Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: PayoutError;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GigListResponse extends PaginatedResponse<Gig> {
  summary?: {
    total_amount: number;
    total_fees: number;
    total_payouts: number;
  };
}

export interface GigLogListResponse extends PaginatedResponse<GigLog> {
  gig?: Gig;
}

// =====================================================
// 13. Component Props Types
// =====================================================

export interface GigFinancialFormProps {
  gig: Gig;
  onSubmit: (data: UpdateGigFinancialRequest) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export interface GigLogFormProps {
  gigId: string;
  onSubmit: (data: CreateGigLogRequest) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export interface FinancialSummaryCardProps {
  title: string;
  amount: number;
  description?: string;
  type?: 'income' | 'expense' | 'fee';
}

// =====================================================
// 14. Context Types
// =====================================================

export interface PayoutContextType {
  userRole: UserRole | null;
  gigs: Gig[];
  loading: boolean;
  error: PayoutError | null;
  
  // Actions
  fetchGigs: (params?: GigSearchParams) => Promise<void>;
  createGig: (data: CreateGigRequest) => Promise<Gig>;
  updateGigFinancial: (gigId: string, data: UpdateGigFinancialRequest) => Promise<void>;
  createGigLog: (data: CreateGigLogRequest) => Promise<GigLog>;
  updatePaymentStatus: (gigId: string, status: PaymentStatus) => Promise<void>;
  
  // UI Actions
  setSelectedGig: (gig: Gig | null) => void;
  clearError: () => void;
}

// =====================================================
// 15. All types are already exported above
// =====================================================
