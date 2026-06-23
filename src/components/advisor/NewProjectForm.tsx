"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { getRegions } from "@/lib/data/regions";
import { classifyBusiness } from "@/lib/business/businessClassifier";
import { useLocale } from "@/lib/i18n/client";
import { labelValue } from "@/lib/utils/labels";

const FORM_DRAFT_KEY = "finko:new-project-draft:v1";

type BusinessReview = {
  label: string;
  confidence: number;
  summary: string;
};

function reviewCopy(locale: "ru" | "uz" | "en") {
  return locale === "en"
    ? { title: "Confirm business type", question: "Do you want to analyze this business type?", yes: "Yes, continue", other: "Other", otherPlaceholder: "Enter the correct business type", continueOther: "Continue with this type", hint: "The interview questions will be generated for the confirmed model, not just for random words in the description." }
    : locale === "uz"
      ? { title: "Biznes turini tasdiqlang", question: "Shu biznes turini tahlil qilamizmi?", yes: "Ha, davom etish", other: "Boshqa", otherPlaceholder: "To'g'ri biznes turini kiriting", continueOther: "Shu tur bilan davom etish", hint: "Intervyu savollari tavsifdagi tasodifiy so'zlarga emas, tasdiqlangan modelga qarab tuziladi." }
      : { title: "Подтвердите тип бизнеса", question: "Вы хотите рассмотреть этот тип бизнеса?", yes: "Да, продолжить", other: "Другое", otherPlaceholder: "Введите корректный тип бизнеса", continueOther: "Продолжить с этим типом", hint: "Вопросы интервью будут собраны под подтвержденную модель, а не под случайные слова в описании." };
}


const demoByLocale = {
  ru: {
    businessType: "Кофейня",
    businessIdea: "Хочу открыть небольшую кофейню возле университета",
    region: "Ташкент город",
    district: "Юнусабад",
    plannedStartPeriod: "через 2 месяца"
  },
  uz: {
    businessType: "Qahvaxona",
    businessIdea: "Universitet yonida kichik qahvaxona ochmoqchiman",
    region: "Toshkent shahri",
    district: "Yunusobod",
    plannedStartPeriod: "2 oydan keyin"
  },
  en: {
    businessType: "Coffee shop",
    businessIdea: "I want to open a small coffee shop near a university",
    region: "Tashkent City",
    district: "Yunusabad",
    plannedStartPeriod: "in 2 months"
  }
};

export function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, messages } = useLocale();
  const isDemo = searchParams.get("demo") === "true";
  const demo = demoByLocale[locale];
  const [businessType, setBusinessType] = useState(isDemo ? demo.businessType : "");
  const [businessIdea, setBusinessIdea] = useState(isDemo ? demo.businessIdea : "");
  const [region, setRegion] = useState(isDemo ? demo.region : "");
  const [district, setDistrict] = useState(isDemo ? demo.district : "");
  const [plannedStartPeriod, setPlannedStartPeriod] = useState(isDemo ? demo.plannedStartPeriod : "");
  const [consentGiven, setConsentGiven] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<BusinessReview | null>(null);
  const [confirmedSignature, setConfirmedSignature] = useState<string | null>(null);
  const [manualBusinessType, setManualBusinessType] = useState("");
  const regions = useMemo(() => getRegions(locale), [locale]);
  const confirmationCopy = reviewCopy(locale);
  const currentSignature = JSON.stringify({ businessType, businessIdea, region, district });
  const classificationConfirmed = confirmedSignature === currentSignature;
  const isReady = businessType.trim().length >= 2 && businessIdea.trim().length >= 5 && region.trim().length >= 2 && consentGiven;

  useEffect(() => {
    if (isDemo || typeof window === "undefined") {
      setDraftLoaded(true);
      return;
    }
    const raw = window.sessionStorage.getItem(FORM_DRAFT_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw) as Partial<Record<"businessType" | "businessIdea" | "region" | "district" | "plannedStartPeriod", string>> & { consentGiven?: boolean; locale?: string };
        if (!draft.locale || draft.locale === locale) {
          setBusinessType(draft.businessType ?? "");
          setBusinessIdea(draft.businessIdea ?? "");
          setRegion(draft.region ?? "");
          setDistrict(draft.district ?? "");
          setPlannedStartPeriod(draft.plannedStartPeriod ?? "");
          setConsentGiven(Boolean(draft.consentGiven));
        }
      } catch {
        window.sessionStorage.removeItem(FORM_DRAFT_KEY);
      }
    }
    setDraftLoaded(true);
  }, [isDemo, locale]);

  useEffect(() => {
    if (!draftLoaded || isDemo || typeof window === "undefined") return;
    window.sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify({
      businessType,
      businessIdea,
      region,
      district,
      plannedStartPeriod,
      consentGiven,
      locale
    }));
  }, [businessType, businessIdea, region, district, plannedStartPeriod, consentGiven, locale, draftLoaded, isDemo]);

  useEffect(() => {
    setReview(null);
    setManualBusinessType("");
  }, [businessType, businessIdea, region, district]);

  async function createConfirmedProject(overrideBusinessType?: string) {
    if (!isReady) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessType: overrideBusinessType ?? businessType,
        businessIdea,
        region,
        district,
        plannedStartPeriod,
        userLanguage: locale,
        consentGiven,
        consentLocale: locale,
        consentVersion: "1.0"
      })
    });

    if (!response.ok) {
      setSubmitting(false);
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (response.status === 401) {
        setError(locale === "ru" ? "Сессия истекла. Войдите заново через demo-login." : locale === "uz" ? "Sessiya muddati tugadi. demo-login orqali qayta kiring." : "Session expired. Please sign in again via demo-login.");
        router.push("/demo-login?next=/advisor/new");
        return;
      }
      setError(payload?.error ? `${messages.newProject.error}: ${payload.error}` : messages.newProject.error);
      return;
    }

    const data = await response.json();
    if (typeof window !== "undefined") window.sessionStorage.removeItem(FORM_DRAFT_KEY);
    router.push(`/advisor/projects/${data.projectId}`);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady || isSubmitting) return;
    if (!classificationConfirmed) {
      const profile = classifyBusiness({ businessType, businessIdea, region, language: locale });
      const detectedLabel = labelValue(profile.subcategory ?? profile.category, locale);
      setReview({
        label: detectedLabel,
        confidence: Math.round(profile.confidence * 100),
        summary: `${detectedLabel} · ${labelValue(profile.operationalModel ?? "mixed", locale)}`
      });
      return;
    }
    await createConfirmedProject();
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wide text-finko-primaryDark">{messages.newProject.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold">{messages.newProject.title}</h1>
        <p className="mt-2 text-sm text-finko-muted">{messages.newProject.description}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">{messages.newProject.businessType}</span>
            <Input
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value)}
              placeholder={messages.newProject.businessTypePlaceholder}
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">{messages.newProject.businessIdea}</span>
            <Textarea
              value={businessIdea}
              onChange={(event) => setBusinessIdea(event.target.value)}
              placeholder={messages.newProject.businessIdeaPlaceholder}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">{messages.newProject.region}</span>
              <Select value={region} onChange={(event) => setRegion(event.target.value)} required>
                <option value="">{messages.newProject.regionPlaceholder}</option>
                {regions.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
              </Select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">{messages.newProject.district}</span>
              <Input
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                placeholder={messages.newProject.districtPlaceholder}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">{messages.newProject.plannedStart}</span>
              <Input
                value={plannedStartPeriod}
                onChange={(event) => setPlannedStartPeriod(event.target.value)}
                placeholder={messages.newProject.plannedStartPlaceholder}
              />
            </label>
          </div>
          {review ? (
            <div className="rounded-2xl border border-finko-primary/25 bg-finko-primaryLight/40 p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-finko-primaryDark">{confirmationCopy.title}</p>
              <h2 className="mt-1 text-lg font-bold text-finko-text">{confirmationCopy.question}</h2>
              <p className="mt-2 rounded-xl bg-white px-3 py-2 font-semibold text-finko-text">{review.summary}</p>
              <p className="mt-2 text-xs text-finko-muted">{confirmationCopy.hint}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" onClick={() => { setConfirmedSignature(currentSignature); setReview(null); void createConfirmedProject(); }}>
                  {confirmationCopy.yes}
                </Button>
                <Button type="button" variant="outline" onClick={() => setManualBusinessType(businessType)}>
                  {confirmationCopy.other}
                </Button>
              </div>
              {manualBusinessType ? (
                <div className="mt-3 grid gap-2">
                  <Input
                    value={manualBusinessType}
                    onChange={(event) => setManualBusinessType(event.target.value)}
                    placeholder={confirmationCopy.otherPlaceholder}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={manualBusinessType.trim().length < 2 || isSubmitting}
                    onClick={() => {
                      const nextType = manualBusinessType.trim();
                      const nextSignature = JSON.stringify({ businessType: nextType, businessIdea, region, district });
                      setBusinessType(nextType);
                      setConfirmedSignature(nextSignature);
                      setReview(null);
                      setManualBusinessType("");
                      void createConfirmedProject(nextType);
                    }}
                  >
                    {confirmationCopy.continueOther}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <label className="flex items-start gap-3 rounded-2xl border border-finko-border bg-slate-50 p-4 text-sm leading-6">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(event) => setConsentGiven(event.target.checked)}
              className="mt-1 h-4 w-4 accent-finko-primary"
              required
            />
            <span>
              {messages.newProject.consentText}{" "}
              <Link href="/privacy?from=/advisor/new" className="font-semibold text-finko-primary hover:text-finko-primaryDark">
                {messages.newProject.privacyLink}
              </Link>
            </span>
          </label>
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting || !isReady}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {messages.newProject.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
