"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  getCompanyAction,
  updateCompanyAction,
  CompanyInput,
} from "@/lib/actions/recruiter.action";

export default function CompanyProfilePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CompanyInput>({
    name: "",
    description: "",
    website: "",
    location: "",
    industry: "",
    size: "",
  });

  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await getCompanyAction();
        if (res.data) {
          setFormData({
            name: res.data.name || "",
            description: res.data.description || "",
            website: res.data.website || "",
            location: res.data.location || "",
            industry: res.data.industry || "",
            size: res.data.size || "",
          });
        }
      } catch {
        // หากยังไม่มีบริษัท ไม่ต้องแสดง error
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await updateCompanyAction(formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/recruiter/jobs");
      }, 1000);
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">
          Set up your company information before posting jobs.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          Company profile saved successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldGroup className="gap-4">
          <Field className="gap-1">
            <FieldLabel required htmlFor="name">
              Company Name
            </FieldLabel>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Acme Corp"
            />
          </Field>

          <Field className="gap-1">
            <FieldLabel htmlFor="industry">Industry</FieldLabel>
            <Input
              id="industry"
              value={formData.industry || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, industry: e.target.value }))
              }
              placeholder="e.g. Software & Technology"
            />
          </Field>

          <Field className="gap-1">
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="e.g. Bangkok, Thailand"
            />
          </Field>

          <Field className="gap-1">
            <FieldLabel htmlFor="website">Website</FieldLabel>
            <Input
              id="website"
              type="url"
              value={formData.website || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              placeholder="https://example.com"
            />
          </Field>

          <Field className="gap-1">
            <FieldLabel htmlFor="size">Company Size</FieldLabel>
            <Input
              id="size"
              value={formData.size || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, size: e.target.value }))
              }
              placeholder="e.g. 10-50 employees"
            />
          </Field>

          <Field className="gap-1">
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <textarea
              id="description"
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Tell candidates about your company culture and mission..."
            />
          </Field>
        </FieldGroup>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? "Saving..." : "Save Company Profile"}
        </Button>
      </form>
    </div>
  );
}
