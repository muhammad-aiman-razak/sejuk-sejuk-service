"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { reviewOrder, closeOrder } from "@/app/actions/manager";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { OrderDetails, ServiceAttachment, AuditLog } from "@/types";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Film,
  ImageIcon,
  Clock,
  Lock,
} from "lucide-react";

interface ReviewDetailProps {
  order: OrderDetails;
  attachments: ServiceAttachment[];
  auditLogs: AuditLog[];
}

export function ReviewDetail({
  order,
  attachments,
  auditLogs,
}: ReviewDetailProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReview() {
    setIsSubmitting(true);
    const result = await reviewOrder(order.id, currentUser.id, reviewNotes);

    if (result.success) {
      toast.success("Order reviewed successfully");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  }

  async function handleClose() {
    setIsSubmitting(true);
    const result = await closeOrder(order.id, currentUser.id);

    if (result.success) {
      toast.success("Order closed");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  }

  function getAttachmentIcon(fileType: string) {
    if (fileType === "photo") return <ImageIcon className="h-4 w-4" />;
    if (fileType === "video") return <Film className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  }

  return (
    <div>
      <Link
        href="/manager"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reviews
      </Link>

      {/* Order & Service Report Summary */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-medium">
            {order.order_no}
          </span>
          <Badge status={order.status} />
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-gray-500">Customer</dt>
              <dd className="font-medium text-gray-900">
                {order.customer_name}
              </dd>
              <dd className="text-gray-500">{order.customer_phone}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Technician</dt>
              <dd className="font-medium text-gray-900">
                {order.technician_name ?? "—"}
              </dd>
            </div>
          </div>

          <div>
            <dt className="text-gray-500">Address</dt>
            <dd className="text-gray-900">{order.address}</dd>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          {/* Service report details */}
          {order.work_done && (
            <>
              <div className="border-t pt-3">
                <dt className="text-gray-500">Work Done</dt>
                <dd className="mt-1 text-gray-900">{order.work_done}</dd>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-gray-500">Extra Charges</dt>
                  <dd className="text-gray-900">
                    {formatCurrency(order.extra_charges ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Final Amount</dt>
                  <dd className="font-semibold text-gray-900">
                    {formatCurrency(order.final_amount)}
                  </dd>
                </div>
                {order.completed_at && (
                  <div>
                    <dt className="text-gray-500">Completed</dt>
                    <dd className="text-gray-900">
                      {formatDate(order.completed_at)}
                    </dd>
                  </div>
                )}
              </div>

              {order.technician_remarks && (
                <div>
                  <dt className="text-gray-500">Technician Remarks</dt>
                  <dd className="text-gray-900">
                    {order.technician_remarks}
                  </dd>
                </div>
              )}

              {order.payment_amount != null && (
                <div className="grid grid-cols-2 gap-4 border-t pt-3">
                  <div>
                    <dt className="text-gray-500">Payment Collected</dt>
                    <dd className="text-gray-900">
                      {formatCurrency(order.payment_amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Payment Method</dt>
                    <dd className="capitalize text-gray-900">
                      {order.payment_method?.replace("_", " ") ?? "—"}
                    </dd>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Review info (if already reviewed) */}
          {order.reviewed_at && (
            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-gray-500">Reviewed By</dt>
                  <dd className="text-gray-900">
                    {order.reviewer_name ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Reviewed At</dt>
                  <dd className="text-gray-900">
                    {formatDate(order.reviewed_at)}
                  </dd>
                </div>
              </div>
              {order.review_notes && (
                <div className="mt-2">
                  <dt className="text-gray-500">Review Notes</dt>
                  <dd className="text-gray-900">{order.review_notes}</dd>
                </div>
              )}
            </div>
          )}
        </dl>
      </Card>

      {/* Attachments */}
      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Attachments ({attachments.length})
        </h3>
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-500">No attachments uploaded.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map((attachment) =>
              attachment.file_type === "photo" ? (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-lg border"
                >
                  <Image
                    src={attachment.file_url}
                    alt={attachment.original_name ?? "Attachment"}
                    width={200}
                    height={150}
                    className="h-32 w-full object-cover transition-opacity group-hover:opacity-80"
                  />
                </a>
              ) : (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {getAttachmentIcon(attachment.file_type)}
                  <span className="truncate">
                    {attachment.original_name ?? "File"}
                  </span>
                </a>
              )
            )}
          </div>
        )}
      </Card>

      {/* Audit Trail */}
      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Audit Trail
        </h3>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-gray-500">No audit records.</p>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 text-sm"
              >
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <p className="text-gray-900">
                    <span className="font-medium capitalize">
                      {log.action.replace("_", " ")}
                    </span>
                    {log.old_value && log.new_value && (
                      <span className="text-gray-500">
                        {" "}
                        — {log.old_value} → {log.new_value}
                      </span>
                    )}
                    {!log.old_value && log.new_value && (
                      <span className="text-gray-500">
                        {" "}
                        — {log.new_value}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Action buttons */}
      {order.status === "job_done" && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Review This Order
          </h3>
          <Textarea
            label="Review Notes (Optional)"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Any notes about this job..."
          />
          <Button
            onClick={handleReview}
            isLoading={isSubmitting}
            className="mt-4 w-full py-3"
            size="lg"
          >
            <CheckCircle className="h-5 w-5" />
            Approve & Review
          </Button>
        </Card>
      )}

      {order.status === "reviewed" && (
        <Card>
          <Button
            onClick={handleClose}
            isLoading={isSubmitting}
            variant="secondary"
            className="w-full py-3"
            size="lg"
          >
            <Lock className="h-5 w-5" />
            Close Order
          </Button>
        </Card>
      )}

      {order.status === "closed" && (
        <Card>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            <span>This order has been closed.</span>
          </div>
        </Card>
      )}
    </div>
  );
}
