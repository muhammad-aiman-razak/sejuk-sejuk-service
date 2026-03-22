import { Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";

export type AiToolName =
  | "getJobsByTechnician"
  | "getJobCount"
  | "getTechnicianPerformance"
  | "getDailySummary"
  | "getOrderDetails";

export const AI_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getJobsByTechnician",
    description:
      "Get a list of jobs/orders for a specific technician, optionally filtered by status and date range. Returns order details including order number, customer name, service type, status, and completion time.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        technicianName: {
          type: Type.STRING,
          description:
            "The technician's name (e.g., 'Ali', 'John', 'Bala', 'Yusoff')",
        },
        status: {
          type: Type.STRING,
          description:
            "Filter by order status. Use 'completed' for job_done/reviewed/closed, or a specific status: new, assigned, in_progress, job_done, reviewed, closed",
        },
        dateFrom: {
          type: Type.STRING,
          description: "Start date in ISO format (YYYY-MM-DD)",
        },
        dateTo: {
          type: Type.STRING,
          description: "End date in ISO format (YYYY-MM-DD)",
        },
      },
      required: ["technicianName"],
    },
  },
  {
    name: "getJobCount",
    description:
      "Count the number of jobs/orders matching the given filters. Use this when the user asks 'how many' questions about orders or jobs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description:
            "Filter by status. Use 'completed' for job_done/reviewed/closed, or a specific status",
        },
        technicianName: {
          type: Type.STRING,
          description: "Filter by technician name",
        },
        dateFrom: {
          type: Type.STRING,
          description: "Start date in ISO format (YYYY-MM-DD)",
        },
        dateTo: {
          type: Type.STRING,
          description: "End date in ISO format (YYYY-MM-DD)",
        },
      },
    },
  },
  {
    name: "getTechnicianPerformance",
    description:
      "Get performance metrics for all technicians for a given week. Returns jobs completed, total revenue, average job value, and reschedule count per technician. Use this for ranking, comparison, or 'who completed the most' questions.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        weekStart: {
          type: Type.STRING,
          description:
            "The Monday of the target week in ISO format (YYYY-MM-DD). Defaults to current week if not provided.",
        },
      },
    },
  },
  {
    name: "getDailySummary",
    description:
      "Get a daily summary of orders including total orders, completed, assigned, and in-progress counts per day. Use for daily operations overview.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dateFrom: {
          type: Type.STRING,
          description: "Start date in ISO format (YYYY-MM-DD)",
        },
        dateTo: {
          type: Type.STRING,
          description: "End date in ISO format (YYYY-MM-DD)",
        },
      },
    },
  },
  {
    name: "getOrderDetails",
    description:
      "Get full details for a specific order by order number or order ID. Returns customer info, technician, service type, status, amounts, and review details.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderNo: {
          type: Type.STRING,
          description:
            "The order number (e.g., 'ORD-20260304-0001')",
        },
        orderId: {
          type: Type.STRING,
          description: "The order UUID",
        },
      },
    },
  },
];
