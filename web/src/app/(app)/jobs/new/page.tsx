"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createRecruiterJob, JobInput } from "@/lib/api/recruiter.api";

export default function CreateJobPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<JobInput>({
    title: "",
    description: "",
    location: "",
    employmentType: "FULL_TIME",
    salaryMin: undefined,
    salaryMax: undefined,
    skills: [],
    status: "DRAFT",
  });

  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills?.includes(skillInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          skills: [...(prev.skills || []), skillInput.trim()],
        }));
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await createRecruiterJob(formData);
        if (res.error) {
          setError(res.error.message || "Failed to create job");
          return;
        }
        router.push("/recruiter/jobs");
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      }
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
          className={buttonVariants({ variant: "outline" })}
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
              placeholder="e.g. Senior Full-Stack Developer"
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
              placeholder="Describe the job responsibilities, requirements, and benefits..."
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field className="gap-1">
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g. Remote / Bangkok"
              />
            </Field>

            <Field className="gap-1">
              <FieldLabel htmlFor="employmentType">Employment Type</FieldLabel>
              <select
                id="employmentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    employmentType: e.target.value,
                  }))
                }
              >
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field className="gap-1">
              <FieldLabel htmlFor="salaryMin">Min Salary (THB)</FieldLabel>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryMin: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                placeholder="e.g. 50000"
              />
            </Field>

            <Field className="gap-1">
              <FieldLabel htmlFor="salaryMax">Max Salary (THB)</FieldLabel>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    salaryMax: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                placeholder="e.g. 80000"
              />
            </Field>
          </div>

          <Field className="gap-1">
            <FieldLabel htmlFor="skills">Required Skills (Press Enter to add)</FieldLabel>
            <Input
              id="skills"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="e.g. React, Node.js, TypeScript"
            />
            {formData.skills && formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </FieldGroup>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" size="lg" disabled={isPending}>
            {isPending ? "Creating Job..." : "Save as Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}