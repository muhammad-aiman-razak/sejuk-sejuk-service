"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { createServiceReportSchema } from "@/lib/validations/service-report";
import { updateOrderStatus, submitServiceReport } from "@/app/actions/technician";
import { formatCurrency, formatDate, getFileType } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileUploader } from "./FileUploader";
import type { OrderDetails } from "@/types";
import { ArrowLeft, CheckCircle, Clock, Play } from "lucide-react";

interface ServiceReportFormProps {
  order: OrderDetails;
}

const INITIAL_FORM_DATA = {
  workDone: "",
  extraCharges: 0,
  remarks: "",
  paymentAmount: 0,
  paymentMethod: "",
};

/** Uploads a file to Supabase Storage and returns the public URL. */
async function uploadFile(file: File, orderId: string): Promise<string> {
  const supabase = createClient();
  const extension = file.name.split(".").pop();
  const filePath = `${orderId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("order-attachments")
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload ${file.name}: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("order-attachments")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export function ServiceReportForm({ order }: ServiceReportFormProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [files, setFiles] = useState<File[]>([]);
  const [receiptFile, setReceiptFile] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const extraCharges = Number(formData.extraCharges) || 0;
  const finalAmount = order.quoted_price + extraCharges;

  function handleChange(field: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleStartJob() {
    setIsStartingJob(true);
    const result = await updateOrderStatus(
      order.id,
      "assigned",
      "in_progress",
      currentUser.id
    );

    if (result.success) {
      toast.success("Job started");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsStartingJob(false);
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();

    // Client-side Zod validation
    const parsed = createServiceReportSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      // Upload service files to Supabase Storage
      const fileUrls = await Promise.all(
        files.map(async (file) => ({
          url: await uploadFile(file, order.id),
          fileType: getFileType(file.type),
          originalName: file.name,
        }))
      );

      // Upload receipt photo if present
      let receiptUrl: string | undefined;
      if (receiptFile.length > 0) {
        receiptUrl = await uploadFile(receiptFile[0], order.id);
      }

      // Build payment object if payment amount provided
      const hasPayment =
        formData.paymentAmount > 0 && formData.paymentMethod !== "";
      const payment = hasPayment
        ? {
            amount: formData.paymentAmount,
            method: formData.paymentMethod as
              | "cash"
              | "bank_transfer"
              | "card"
              | "ewallet",
            receiptUrl,
          }
        : undefined;

      // Call server action
      const result = await submitServiceReport({
        orderId: order.id,
        userId: currentUser.id,
        workDone: parsed.data.workDone,
        extraCharges: parsed.data.extraCharges,
        remarks: parsed.data.remarks,
        fileUrls,
        payment,
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success("Service report submitted");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      toast.error(message);
    }

    setIsSubmitting(false);
  }

  // ----- Read-only order header -----
  const orderHeader = (
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-medium">{order.order_no}</span>
        <Badge status={order.status} />
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-gray-500">Customer</dt>
          <dd className="font-medium text-gray-900">{order.customer_name}</dd>
          <dd className="text-gray-500">{order.customer_phone}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Address</dt>
          <dd className="text-gray-900">{order.address}</dd>
        </div>
        <div className="flex gap-6">
          <div>
            <dt className="text-gray-500">Service Type</dt>
            <dd className="text-gray-900">{order.service_type}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Quoted Price</dt>
            <dd className="text-gray-900">
              {formatCurrency(order.quoted_price)}
            </dd>
          </div>
        </div>
        {order.scheduled_at && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(order.scheduled_at)}</span>
          </div>
        )}
      </dl>
    </Card>
  );

  // ----- Status: assigned — show "Start Job" -----
  if (order.status === "assigned") {
    return (
      <div>
        <Link
          href="/technician"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Jobs
        </Link>
        {orderHeader}
        <Button
          onClick={handleStartJob}
          isLoading={isStartingJob}
          className="w-full py-3 text-base"
          size="lg"
        >
          <Play className="h-5 w-5" />
          Start Job
        </Button>
      </div>
    );
  }

  // ----- Status: job_done — show summary -----
  if (order.status === "job_done") {
    return (
      <div>
        <Link
          href="/technician"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Jobs
        </Link>
        {orderHeader}
        <Card>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">Report submitted</p>
          </div>
          {order.work_done && (
            <div className="mt-3 text-sm">
              <p className="text-gray-500">Work Done</p>
              <p className="text-gray-900">{order.work_done}</p>
            </div>
          )}
          <div className="mt-3 flex gap-6 text-sm">
            {order.extra_charges != null && order.extra_charges > 0 && (
              <div>
                <p className="text-gray-500">Extra Charges</p>
                <p className="text-gray-900">
                  {formatCurrency(order.extra_charges ?? 0)}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Final Amount</p>
              <p className="font-medium text-gray-900">
                {formatCurrency(order.final_amount)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Waiting for manager review.
          </p>
          {/* WhatsApp button placeholder — Phase 4 */}
        </Card>
      </div>
    );
  }

  // ----- Status: in_progress — show success or form -----
  if (isSuccess) {
    return (
      <div>
        <Link
          href="/technician"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Jobs
        </Link>
        {orderHeader}
        <Card>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">Service report submitted successfully</p>
          </div>
          <div className="mt-3 text-sm">
            <p className="text-gray-500">Final Amount</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(finalAmount)}
            </p>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Waiting for manager review.
          </p>
          {/* WhatsApp button placeholder — Phase 4 */}
        </Card>
        <Link href="/technician" className="mt-4 block">
          <Button variant="secondary" className="w-full py-3" size="lg">
            Back to My Jobs
          </Button>
        </Link>
      </div>
    );
  }

  // ----- Status: in_progress — show service report form -----
  return (
    <div>
      <Link
        href="/technician"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Jobs
      </Link>
      {orderHeader}

      <form onSubmit={handleSubmitReport} className="space-y-5">
        <h2 className="text-lg font-semibold">Service Report</h2>

        {/* Read-only info */}
        <div className="flex justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-500">Technician</span>
          <span className="font-medium text-gray-900">{currentUser.name}</span>
        </div>
        <div className="flex justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-500">Timestamp</span>
          <span className="font-medium text-gray-900">
            {formatDate(new Date().toISOString())}
          </span>
        </div>

        {/* Editable fields */}
        <Textarea
          label="Work Done"
          value={formData.workDone}
          onChange={(e) => handleChange("workDone", e.target.value)}
          error={fieldErrors.workDone}
          placeholder="Describe the work completed..."
          required
        />

        <Input
          label="Extra Charges (RM)"
          type="number"
          min={0}
          step="0.01"
          value={formData.extraCharges}
          onChange={(e) => handleChange("extraCharges", e.target.value)}
          error={fieldErrors.extraCharges}
        />

        <div className="flex justify-between rounded-md bg-blue-50 px-3 py-2 text-sm">
          <span className="font-medium text-blue-700">Final Amount</span>
          <span className="font-semibold text-blue-900">
            {formatCurrency(finalAmount)}
          </span>
        </div>

        <FileUploader
          files={files}
          onChange={setFiles}
          maxFiles={6}
          label="Upload Photos / Videos / PDF"
        />

        <Textarea
          label="Remarks"
          value={formData.remarks}
          onChange={(e) => handleChange("remarks", e.target.value)}
          error={fieldErrors.remarks}
          placeholder="Any additional remarks..."
        />

        {/* Payment section */}
        <div className="border-t pt-5">
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            Payment Collection (Optional)
          </h3>

          <div className="space-y-4">
            <Input
              label="Payment Amount (RM)"
              type="number"
              min={0}
              step="0.01"
              value={formData.paymentAmount}
              onChange={(e) => handleChange("paymentAmount", e.target.value)}
            />

            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => handleChange("paymentMethod", e.target.value)}
            >
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="ewallet">E-Wallet</option>
            </Select>

            <FileUploader
              files={receiptFile}
              onChange={setReceiptFile}
              maxFiles={1}
              label="Receipt Photo"
            />
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full py-3 text-base"
          size="lg"
        >
          Submit Report
        </Button>
      </form>
    </div>
  );
}
