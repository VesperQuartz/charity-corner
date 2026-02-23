"use client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  Activity as ActivityIcon,
  Clock,
  LoaderCircle,
  Search,
  Tag,
} from "lucide-react";
import React, { Activity, useMemo, useState } from "react";
import { orpc } from "@/lib/orpc";
import type { EventLogEntry } from "@/types";

const EventLog = () => {
  const eventLogsQuery = useQuery(orpc.getEventLogs.queryOptions());
  const eventLogs = eventLogsQuery.data ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const filteredLogs = useMemo(() => {
    return eventLogs
      .filter((log) => {
        const matchesSearch =
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAction =
          actionFilter === "ALL" || log.action === actionFilter;
        const matchesEntity =
          entityFilter === "ALL" || log.entity === entityFilter;
        const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter);

        return matchesSearch && matchesAction && matchesEntity && matchesDate;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [eventLogs, searchTerm, actionFilter, entityFilter, dateFilter]);

  const getActionColor = (action: EventLogEntry["action"]) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "SALE":
        return "bg-purple-100 text-purple-800";
      case "LOGIN":
        return "bg-indigo-100 text-indigo-800";
      case "LOGOUT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Activity mode="visible">
      <div className="flex h-full animate-in flex-col gap-4 duration-300 fade-in">
        {/* Header */}
        <div className="flex shrink-0 flex-col items-start justify-between rounded-lg bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <ActivityIcon className="text-pink-600" /> System Event Log
            </h2>
            <p className="text-sm text-gray-500">
              Audit trail of all system activities and changes
            </p>
          </div>
          <div className="mt-4 text-right md:mt-0">
            <div className="text-sm font-medium text-gray-600">
              Total Events
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {eventLogs.length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-4 shadow-sm md:flex-row">
          <div className="relative w-full flex-1">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="SALE">Sale</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="ALL">All Entities</option>
              <option value="PRODUCT">Product</option>
              <option value="VENDOR">Vendor</option>
              <option value="SUPPLY">Supply</option>
              <option value="TRANSACTION">Transaction</option>
              <option value="USER">User</option>
              <option value="SYSTEM">System</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Log Table */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-700 uppercase shadow-sm">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Entity</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">User</th>
                </tr>
              </thead>
              <tbody>
                {eventLogsQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <LoaderCircle
                          className="mb-4 animate-spin opacity-20"
                          size={48}
                        />
                        <p className="text-lg">Loading events...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <ActivityIcon size={48} className="mb-4 opacity-20" />
                        <p>No event logs found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b bg-white transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          {format(
                            parseISO(log.timestamp),
                            "yyyy-MM-dd HH:mm:ss",
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {log.entity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        {log.details}
                        {log.entityId && (
                          <div className="mt-1 font-mono text-xs text-gray-400">
                            ID: {log.entityId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                            {log.performedBy.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{log.performedBy}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Activity>
  );
};
export default EventLog;
