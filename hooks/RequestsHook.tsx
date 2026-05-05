import { RequestDTO } from "@/interfaces/Firewall";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { IntlShape } from "react-intl";
import { format } from "date-fns";
import { FiCheck, FiX } from "react-icons/fi";
import { useSession } from "next-auth/react";

export const useRequestsColumns = (intl: IntlShape, completeTask: (id: string, approved: boolean) => void) => {
  const { data: session } = useSession();
  
  const columns = useMemo<ColumnDef<RequestDTO, unknown>[]>(
    () => [
      {
        accessorFn: (row) => row?.id,
        accessorKey: "id",
        cell: (info) => info.getValue() ?? "N/A",
        header: () => (
          <span>
            {intl.formatMessage({
              id: "id",
              defaultMessage: "Request Id",
            })}
          </span>
        ),
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row?.firewallId,
        accessorKey: "firewallId",
        cell: (info) => info.getValue() ?? "N/A",
        header: () => (
          <span>
            {intl.formatMessage({
              id: "firewallId",
              defaultMessage: "Firewall Id",
            })}
          </span>
        ),
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row?.publicIp,
        accessorKey: "publicIp",
        cell: (info) => info.getValue() ?? "N/A",
        header: () => (
          <span>
            {intl.formatMessage({
              id: "publicIP",
              defaultMessage: "Public IP",
            })}
          </span>
        ),
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row?.duration,
        accessorKey: "duration",
        cell: (info) => {
          const val = info.getValue();
          if (val === "1_day") return "1 day";
          if (val === "1_week") return "1 week";
          return val ?? "N/A";
        },
        header: () => (
          <span>
            {intl.formatMessage({ id: "duration", defaultMessage: "Duration" })}
          </span>
        ),
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row?.createdAt,
        accessorKey: "createdAt",
        cell: (info) => {
          const value = info.getValue() as string;
          return value ? format(new Date(value), "dd MMMM yyyy") : "N/A";
        },
        header: () => (
          <span>
            {intl.formatMessage({
              id: "createdAt",
              defaultMessage: "Created At",
            })}
          </span>
        ),
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row?.requestedBy,
        accessorKey: "requestedBy",
        cell: (info) => info.getValue() ?? "N/A",
        header: () => (
          <span>
            {intl.formatMessage({
              id: "requestedBy",
              defaultMessage: "Requested By",
            })}
          </span>
        ),
        footer: (props) => props.column.id,
      },
      {
        accessorFn: (row) => row?.status,
        accessorKey: "status",
        cell: (info) => info.getValue() ?? "N/A",
        header: () => (
          <span>
            {intl.formatMessage({ id: "status", defaultMessage: "Status" })}
          </span>
        ),
        footer: (props) => props.column.id,
      },
      { 
        id: "actions",
        header: () => (
          <span>
            {intl.formatMessage({ id: "actions", defaultMessage: "Actions" })}
          </span>
        ),
        cell: ({ row }) => {
          const requestId = row.original.id;
          const isPending = row.original.status === "Pending";
          if (!requestId) return null;
          return (
            <div className="flex gap-2">
              <button
                className={`transition ${
                (session?.user?.email === "gjorgjevikj@pces.mk" ||
                 session?.user?.email === "matea.georgievska@pces.mk") && isPending
                     ? "text-green-600 hover:text-green-800"
                    : "text-gray-400 cursor-not-allowed"
                }`}                
                title="Approve"
                onClick={() => completeTask(requestId, true)}
              >
                <FiCheck size={18} />
              </button>
              <button
                className={`transition ${
                 (session?.user?.email === "gjorgjevikj@pces.mk" ||
                 session?.user?.email === "matea.georgievska@pces.mk") && isPending
                  ? "text-red-600 hover:text-red-800"
                  : "text-gray-400 cursor-not-allowed"
              }`}
                title="Reject"
                onClick={() => completeTask(requestId, false)}
              >
                <FiX size={18} />
              </button>
            </div>
          );
        },
        footer: (props) => props.column.id,
      },
    ],
    [intl, session?.user?.email, completeTask],
  );
  return columns;
};