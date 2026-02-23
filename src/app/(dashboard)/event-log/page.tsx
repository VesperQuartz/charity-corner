import type { Metadata } from "next";
import EventLog from "@/components/pages/event-log";

export const metadata: Metadata = {
  title: "Event Log | Charity Corner",
  description: "System Event Log",
};

export default function EventLogPage() {
  return <EventLog />;
}
