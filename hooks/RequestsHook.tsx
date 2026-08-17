import { RequestDTO } from "@/interfaces/Firewall";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { IntlShape } from "react-intl";
import { format } from "date-fns";
import { FiCheck, FiX } from "react-icons/fi";
import { useStore } from "./StoreHook";
import { useSession } from "next-auth/react";

export const useRequestsColumns = (
  intl: IntlShape,
  completeTask: (id: string, approved: boolean) => void,
) => {
  const { generalStore } = useStore();
  const { data: session } = useSession();

  const columns = useMemo<ColumnDef<RequestDTO, unknown>[]>(
    () => [
      {
        accessorFn: (row) => row?.requestId ?? row?.id,
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
          const requestId = row.original.requestId;
          const isPending = row.original.status === "Pending";
          const project = row.original.project ?? "";
          const approversForProject = generalStore.approvers[project] ?? [];

          const isApprover = approversForProject.some(
            (e) => e.toLowerCase() === session?.user?.email?.toLowerCase(),
          );
          const canAct = !!requestId && isPending && isApprover;

          return (
            <div className="flex gap-2">
              <button
                disabled={!canAct}
                className={`transition ${
                  canAct
                    ? "text-green-600 hover:text-green-800"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title={canAct ? "Approve" : "Approve unavailable"}
                onClick={() => canAct && completeTask(requestId, true)}
              >
                <FiCheck size={18} />
              </button>
              <button
                disabled={!canAct}
                className={`transition ${
                  canAct
                    ? "text-red-600 hover:text-red-800"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                title={canAct ? "Reject" : "Reject unavailable"}
                onClick={() => canAct && completeTask(requestId, false)}
              >
                <FiX size={18} />
              </button>
            </div>
          );
        },
        footer: (props) => props.column.id,
      },
    ],
    [intl, generalStore.approvers, session?.user?.email, completeTask],
  );
  return columns;
};
