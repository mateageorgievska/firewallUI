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
        accessorFn: (row) => row?.requestId,
        accessorKey: "requestId",
        cell: (info) => info.getValue() ?? "N/A",
        header: () => (
          <span>
            {intl.formatMessage({
              id: "requestId",
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
        accessorFn: (row) => row?.project,
        accessorKey: "project",
        cell: (info) => info.getValue() ?? "N/A",
        header: () => (
          <span>
            {intl.formatMessage({
              id: "project",
              defaultMessage: "Project",
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
          const instanceId = row.original.instanceId;
          const isPending = row.original.status === "Pending";

          const canApprove =
            !!instanceId &&
            isPending &&
            (session?.user?.email === "gjorgjevikj@pces.mk" ||
              session?.user?.email === "matea.georgievska@pces.mk" ||
              session?.user?.email === "trajkov@pces.mk" ||
              session?.user?.email === "aleksandar.gjorgjevikj@pces.mk" ||
              (row.original.project === 'AFRICAP' && session?.user?.email === "kalajdzievska@pces.mk"));

          const canReject =
            !!instanceId &&
            isPending &&
            (session?.user?.email === "gjorgjevikj@pces.mk" ||
              session?.user?.email === "matea.georgievska@pces.mk" ||
              session?.user?.email === "trajkov@pces.mk" ||
              session?.user?.email === "aleksandar.gjorgjevikj@pces.mk" ||
              (row.original.project === 'AFRICAP' && session?.user?.email === "kalajdzievska@pces.mk") ||
              (row.original.project === 'ADSL' && session?.user?.email === "agyemang-sereboo@pces.mk"));

          return (
            <div className="flex gap-2">
              <button
                disabled={!canApprove}
                className={`transition ${
                  canApprove
                    ? "text-green-600 hover:text-green-800"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title={instanceId ? "Approve" : "Approve unavailable"}
                onClick={() => canApprove && completeTask(instanceId, true)}
              >
                <FiCheck size={18} />
              </button>
              <button
                disabled={!canReject}
                className={`transition ${
                  canReject
                    ? "text-red-600 hover:text-red-800"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title={instanceId ? "Reject" : "Reject unavailable"}
                onClick={() => canReject && completeTask(instanceId, false)}
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