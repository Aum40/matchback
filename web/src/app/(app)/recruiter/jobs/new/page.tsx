"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  createRecruiterJobAction,
  JobInput,
} from "@/lib/actions/recruiter.action";

export default function CreateJobPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    location: string;
    employmentType: string;
    workArrangement: "ONSITE" | "HYBRID" | "REMOTE";
    salaryMin: string;
    salaryMax: string;
    skillInput: string;
    skills: string[];
  }>({
    title: "",
    description: "",
    location: "",
    employmentType: "FULL_TIME",
    workArrangement: "HYBRID", // 👈 ค่าเริ่มต้น
    salaryMin: "",
    salaryMax: "",
    skillInput: "",
    skills: [],
  });

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && formData.skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(formData.skillInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, prev.skillInput.trim()],
          skillInput: "",
        }));
      }
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // หากพิมพ์ skill ค้างไว้ในช่องแต่ยังไม่ได้กด Enter ให้ดึงเข้าไปใน array ให้เอง
    let finalSkills = [...formData.skills];
    if (formData.skillInput.trim() && !finalSkills.includes(formData.skillInput.trim())) {
      finalSkills.push(formData.skillInput.trim());
    }

    if (finalSkills.length === 0) {
      setError("Please add at least 1 required skill (press Enter after typing).");
      return;
    }

    startTransition(async () => {
      const payload: JobInput = {
        title: formData.title,
        description: formData.description,
        location: formData.location || undefined,
        employmentType: formData.employmentType || undefined,
        workArrangement: formData.workArrangement,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
        skills: finalSkills,
        status: "DRAFT",
      };

      const res = await createRecruiterJobAction(payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/recruiter/jobs");
    });
  };

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Post a New Job</h1>
          <p className="text-muted-foreground">
            Create a new job posting for candidates to discover.
          </p>
        </div>
        <Link
          href="/recruiter/jobs"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to Jobs
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldGroup className="gap-4">
          <Field className="gap-1">
            <FieldLabel required htmlFor="title">
              Job Title
            </FieldLabel>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Senior Frontend Developer"
            />
          </Field>

          <Field className="gap-1">
            <FieldLabel required htmlFor="description">
              Job Description
            </FieldLabel>
            <textarea
              id="description"
              required
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field className="gap-1">
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g. Bangkok, Thailand"
              />
            </Field>

            <Field className="gap-1">
              <FieldLabel htmlFor="employmentType">Employment Type</FieldLabel>
              <select
                id="employmentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, employmentType: e.target.value }))
                }
              >
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </Field>

            <Field className="gap-1">
              <FieldLabel htmlFor="workArrangement">Work Arrangement</FieldLabel>
              <select
                id="workArrangement"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.workArrangement}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    workArrangement: e.target.value as "ONSITE" | "HYBRID" | "REMOTE",
                  }))
                }
              >
                <option value="ONSITE">On-site</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field className="gap-1">
              <FieldLabel htmlFor="salaryMin">Min Salary (THB)</FieldLabel>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, salaryMin: e.target.value }))
                }
                placeholder="e.g. 50000"
              />
            </Field>

            <Field className="gap-1">
              <FieldLabel htmlFor="salaryMax">Max Salary (THB)</FieldLabel>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, salaryMax: e.target.value }))
                }
                placeholder="e.g. 80000"
              />
            </Field>
          </div>

          <Field className="gap-1">
            <FieldLabel htmlFor="skills">Required Skills (Press Enter to add)</FieldLabel>
            <Input
              id="skills"
              value={formData.skillInput}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, skillInput: e.target.value }))
              }
              onKeyDown={handleAddSkill}
              placeholder="e.g. React, TypeScript, Node.js"
            />
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </FieldGroup>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? "Creating..." : "Save as Draft"}
        </Button>
      </form>
    </div>
  );
}