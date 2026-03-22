import { TechnicianJobList } from "@/components/technician/TechnicianJobList";

export default function TechnicianPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">My Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">
        Your assigned service orders
      </p>
      <div className="mt-6">
        <TechnicianJobList />
      </div>
    </div>
  );
}
