// —— Vendor (API) ——
export interface DiscountBucketDto {
  hoursBefore: number;
  discountPercent: number;
}

export interface CreateVendorDto {
  name: string;
  vacancyThresholdHours?: number;
  discountBuckets?: DiscountBucketDto[];
  maxDiscountPercent?: number;
  minPrice?: number;
  lockTtlMinutes?: number;
}

/** POST /vendors — 201 */
export interface VendorCreated {
  _id: string;
  name: string;
  apiKey: string;
  vacancyThresholdHours: number;
  discountBuckets: DiscountBucketDto[];
  maxDiscountPercent: number;
  minPrice: number;
  lockTtlMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export type UpdateRulesDto = Partial<
  Pick<
    CreateVendorDto,
    | 'vacancyThresholdHours'
    | 'discountBuckets'
    | 'maxDiscountPercent'
    | 'minPrice'
    | 'lockTtlMinutes'
  >
>;

/** POST /vendors/rules — 200 (no apiKey) */
export type VendorRulesResponse = Omit<VendorCreated, 'apiKey' | 'createdAt'> & {
  updatedAt: string;
};

// —— Slots ——
export type SlotStatus = 'available' | 'locked' | 'booked' | 'expired';

/** GET /slots item */
export interface SlotDocument {
  _id: string;
  slotId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  status: SlotStatus;
  lockId: string | null;
  lockedUntil: string | null;
  bookedAt: string | null;
  discountApplied: number | null;
  finalPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSlotsResponse {
  items: SlotDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SyncSlotsRequest {
  slots: Array<{
    slotId: string;
    startTime: string;
    endTime: string;
    basePrice: number;
  }>;
}

export interface SyncSlotsResponse {
  created: number;
  updated: number;
  skipped: number;
}

/** GET /slots/:slotId/pricing */
export interface SlotPricing {
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  validUntil: string;
}

/** POST /slots/:slotId/lock */
export interface LockSlotResponse {
  lockId: string;
}

/** POST /slots/:slotId/confirm */
export interface ConfirmSlotResponse {
  success: boolean;
}

/** GET /analytics/summary */
export interface AnalyticsSummary {
  totalSlots: number;
  bookedSlots: number;
  recoveredSlots: number;
  recoveredRevenue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
