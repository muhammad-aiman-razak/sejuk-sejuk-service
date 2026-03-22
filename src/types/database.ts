export type OrderStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "job_done"
  | "reviewed"
  | "closed";

export type UserRole = "admin" | "technician" | "manager";

export type FileType = "photo" | "video" | "pdf";

export type PaymentMethod = "cash" | "bank_transfer" | "card" | "ewallet";

export interface Technician {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
  default_price: number | null;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  technician_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  problem_description: string;
  service_type_id: string;
  quoted_price: number;
  assigned_technician_id: string | null;
  admin_notes: string | null;
  status: OrderStatus;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceReport {
  id: string;
  order_id: string;
  work_done: string;
  extra_charges: number;
  remarks: string | null;
  completed_at: string;
  created_at: string;
}

export interface ServiceAttachment {
  id: string;
  service_report_id: string;
  file_url: string;
  file_type: FileType;
  original_name: string | null;
  created_at: string;
}

export interface ServicePayment {
  id: string;
  service_report_id: string;
  amount: number;
  method: PaymentMethod;
  receipt_url: string | null;
  created_at: string;
}

export interface OrderReview {
  id: string;
  order_id: string;
  reviewed_by: string;
  review_notes: string | null;
  reviewed_at: string;
  created_at: string;
}

export interface OrderSchedule {
  id: string;
  order_id: string;
  scheduled_at: string;
  rescheduled_from: string | null;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  order_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: string;
  created_at: string;
}
