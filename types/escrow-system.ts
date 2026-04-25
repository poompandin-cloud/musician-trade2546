// Types for Escrow & Live Tipping System

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  role?: string;
  wallet_balance: number;
  account_type: 'musician' | 'venue' | 'customer';
  payment_qr_url?: string;
  bank_account?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  gig_id: string;
  customer_id?: string;
  amount_paid: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_date: string;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: Profile;
  gig?: Gig;
}

export interface SongRequest {
  id: string;
  gig_id: string;
  musician_id: string;
  customer_id?: string;
  song_name: string;
  tip_amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  request_date: string;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: Profile;
  musician?: Profile;
  gig?: Gig;
}

export interface PlatformFee {
  id: string;
  gig_id?: string;
  booking_id?: string;
  song_request_id?: string;
  fee_amount: number;
  fee_type: 'booking' | 'tip';
  percentage_rate: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'tip_received' | 'booking_release' | 'platform_fee';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id?: string;
  reference_type?: 'booking' | 'song_request' | 'gig';
  description?: string;
  created_at: string;
  // Joined data
  user?: Profile;
}

export interface Gig {
  id: string;
  shop_id: string;
  musician_id?: string;
  title?: string;
  instrument?: string;
  location: string;
  date: string;
  final_price?: number;
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'paid';
  performance_proof_url?: string;
  escrow_amount: number;
  total_bookings: number;
  total_tips: number;
  booking_status: 'pending' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
  // Joined data
  shop?: Profile;
  musician?: Profile;
  bookings?: Booking[];
  song_requests?: SongRequest[];
}

export interface GigEarningsSummary {
  id: string;
  title?: string;
  instrument?: string;
  musician_id?: string;
  total_bookings: number;
  total_tips: number;
  total_earnings: number;
  platform_fees: number;
  musician_payout: number;
  status: string;
  booking_status: string;
}

// API Response Types
export interface CreateBookingRequest {
  gig_id: string;
  amount_paid: number;
}

export interface CreateSongRequestRequest {
  gig_id: string;
  musician_id: string;
  song_name: string;
  tip_amount: number;
}

export interface WalletTransactionRequest {
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  description?: string;
}

// Component Props Types
export interface BookingCardProps {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  onConfirm?: (bookingId: string) => void;
  showActions?: boolean;
}

export interface SongRequestCardProps {
  songRequest: SongRequest;
  onPay?: (requestId: string) => void;
  showCustomerInfo?: boolean;
}

export interface WalletBalanceProps {
  balance: number;
  accountType: 'musician' | 'venue' | 'customer';
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export interface EarningsSummaryProps {
  gigId: string;
  earnings?: GigEarningsSummary;
  loading?: boolean;
}

// Form Types
export interface BookingForm {
  gig_id: string;
  amount_paid: string;
  customer_notes?: string;
}

export interface SongRequestForm {
  gig_id: string;
  musician_id: string;
  song_name: string;
  tip_amount: string;
  customer_notes?: string;
}

export interface WalletForm {
  amount: string;
  description?: string;
}

// Chart/Analytics Types
export interface EarningsChart {
  date: string;
  bookings: number;
  tips: number;
  total: number;
}

export interface VenueAnalytics {
  total_bookings: number;
  total_tips: number;
  total_platform_fees: number;
  active_gigs: number;
  completed_gigs: number;
  monthly_earnings: EarningsChart[];
}

export interface MusicianAnalytics {
  total_earnings: number;
  total_bookings: number;
  total_tips: number;
  platform_fees_paid: number;
  completed_gigs: number;
  upcoming_gigs: number;
  monthly_earnings: EarningsChart[];
}
