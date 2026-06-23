"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";

export function MarketDataUploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setUploading] = useState(false);

  async function upload() {
    if (!file) return;
    setUploading(true);
    setStatus(null);
    const formData = new FormData();
    formData.set("file", file);
    const response = await fetch("/api/admin/market-data/upload", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));
    setStatus(response.ok ? `Imported rows: ${data.imported}` : data.error ?? "Could not upload the file.");
    setUploading(false);
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wide text-finko-primaryDark">Market data</p>
        <h1 className="mt-2 text-3xl font-bold">Upload official statistics</h1>
        <p className="mt-2 text-sm leading-6 text-finko-muted">CSV, XLSX and JSON are supported. Required fields: indicator, year, sourceName, sourceType.</p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Input type="file" accept=".csv,.xlsx,.json" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <Button onClick={upload} disabled={!file || isUploading}>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        {status ? <p className="rounded-2xl bg-slate-50 p-3 text-sm text-finko-muted">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
