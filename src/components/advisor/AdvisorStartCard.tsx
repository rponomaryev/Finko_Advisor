"use client";

import Link from "next/link";
import { ClipboardCheck, MessageSquareText, PieChart, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/client";

const stepIcons = [MessageSquareText, ClipboardCheck, PieChart, Printer] as const;

export function AdvisorStartCard() {
  const { messages } = useLocale();
  const copy = messages.advisorStart;
  return (
    <section className="mx-auto mt-10 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-wide text-finko-primaryDark">{copy.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold">{copy.title}</h2>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-finko-muted">
          {copy.benefits.map((item) => (
            <div key={item} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span>{item}</span>
              <span className="font-semibold text-finko-primaryDark">FINKO</span>
            </div>
          ))}
          <Link href="/advisor/new" className="mt-2">
            <Button className="w-full">{copy.start}</Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">{copy.howTitle}</h2>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {copy.steps.map((title, index) => {
            const Icon = stepIcons[index] ?? MessageSquareText;
            return (
              <div key={title} className="rounded-lg border border-finko-border p-4">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-finko-primaryLight text-finko-primaryDark">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-finko-muted">{copy.stepLabel} {index + 1}</p>
                <h3 className="mt-1 font-semibold">{title}</h3>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
