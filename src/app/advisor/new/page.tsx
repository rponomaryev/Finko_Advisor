import { Suspense } from "react";
import { NewProjectForm } from "@/components/advisor/NewProjectForm";

export default function NewAdvisorPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="rounded-lg bg-white p-6 shadow-finko">Loading form...</div>}>
        <NewProjectForm />
      </Suspense>
    </section>
  );
}
