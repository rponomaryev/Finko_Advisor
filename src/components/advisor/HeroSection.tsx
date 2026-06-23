"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useLocale } from "@/lib/i18n/client";

const featureIcons = [BarChart3, ShieldCheck, FileText];

export function HeroSection() {
  const { messages } = useLocale();
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pt-14">
      <div className="py-8">
        <Badge variant="red">{messages.hero.badge}</Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-finko-text sm:text-5xl lg:text-6xl">
          {messages.hero.title}
          <span className="block text-finko-primary">{messages.hero.subtitle}</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-finko-muted">{messages.hero.description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/advisor/new">
            <Button className="w-full sm:w-auto">
              {messages.hero.start}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/advisor/new?demo=true">
            <Button variant="outline" className="w-full sm:w-auto">{messages.hero.demo}</Button>
          </Link>
        </div>
      </div>
      <div className="relative rounded-[28px] border border-finko-border bg-white p-5 shadow-finko">
        <div className="absolute right-6 top-6 rounded-full bg-finko-primary p-3 text-white"><Sparkles className="h-5 w-5" /></div>
        <div className="rounded-[24px] bg-gradient-to-br from-finko-primaryLight to-white p-6">
          <p className="text-sm font-semibold text-finko-primaryDark">{messages.hero.panelEyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold">{messages.hero.panelTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-finko-muted">{messages.hero.panelText}</p>
        </div>
        <div className="mt-4 grid gap-4">
          {messages.hero.features.map((item, index) => {
            const Icon = featureIcons[index] ?? FileText;
            return (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-finko-border bg-white p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-finko-primaryLight text-finko-primaryDark">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-finko-text">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-finko-muted">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
