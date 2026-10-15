"use client";

import FormAlert from "@/components/features/auth/FormAlert";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/lib/actions/profile.action";
import type { CandidateProfile, Skill } from "@/lib/api/api.type";
import { WORK_ARRANGEMENT_LABELS } from "@/lib/format";
import {
  ProfileFormValues,
  profileFormSchema,
  toProfileInput,
} from "@/lib/schemas/profile.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

const TEXT_FIELDS = [
  {
    name: "headline",
    label: "Headline",
    placeholder: "Final-year CS student looking for a first frontend role",
    multiline: false,
  },
  {
    name: "education",
    label: "Education",
    placeholder: "Degree, university, expected graduation",
    multiline: true,
  },
  {
    name: "experience",
    label: "Work experience",
    placeholder: "Internships, part-time jobs, TA roles — one per line, with what you did",
    multiline: true,
  },
  {
    name: "projects",
    label: "Projects and achievements",
    placeholder: "What you built, the tools you used, and the result",
    multiline: true,
  },
] as const;

function groupByCategory(skills: Skill[]) {
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    groups.set(skill.category, [...(groups.get(skill.category) ?? []), skill]);
  }
  return [...groups.entries()];
}

export default function ProfileForm({
  profile,
  skills,
}: {
  profile: CandidateProfile;
  skills: Skill[];
}) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      headline: profile.headline ?? "",
      education: profile.education ?? "",
      experience: profile.experience ?? "",
      projects: profile.projects ?? "",
      desiredRoles: profile.desiredRoles.join(", "),
      preferredSalaryMin: profile.preferredSalaryMin?.toString() ?? "",
      preferredWorkArrangement: profile.preferredWorkArrangement ?? "",
      skillIds: profile.skills.map((skill) => skill.id),
    },
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const onSubmit = (values: ProfileFormValues) => {
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfileAction(toProfileInput(values));
      if (!result.success) {
        setError("root", { message: result.message });
        return;
      }
      // ค่าปัจจุบันกลายเป็นค่าตั้งต้นใหม่ ปุ่มบันทึกจะกลับไปสถานะ "ไม่มีอะไรเปลี่ยน"
      reset(values);
      setSaved(true);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-6">
        {errors.root?.message && <FormAlert message={errors.root.message} />}

        <FieldSet>
          <FieldLegend>About you</FieldLegend>
          <FieldDescription>
            Only write what you have really done — the resume coach uses this text
            and never adds anything that isn&apos;t here.
          </FieldDescription>
          <FieldGroup className="gap-4">
            {TEXT_FIELDS.map((config) => (
              <Controller
                key={config.name}
                control={control}
                name={config.name}
                render={({ field, fieldState }) => (
                  <Field className="gap-1" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{config.label}</FieldLabel>
                    {config.multiline ? (
                      <Textarea
                        id={field.name}
                        placeholder={config.placeholder}
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        placeholder={config.placeholder}
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                    )}
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Skills</FieldLegend>
          <FieldDescription>
            Tick the skills you can back up with an example. Only ticked skills
            count toward your match score.
          </FieldDescription>
          <Controller
            control={control}
            name="skillIds"
            render={({ field }) => (
              <div className="grid gap-4">
                {groupByCategory(skills).map(([category, items]) => (
                  <fieldset key={category}>
                    <legend className="mb-2 text-sm font-medium">{category}</legend>
                    <div className="flex flex-wrap gap-2">
                      {items.map((skill) => {
                        const checked = field.value.includes(skill.id);
                        return (
                          <label
                            key={skill.id}
                            className="flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() =>
                                field.onChange(
                                  checked
                                    ? field.value.filter((id) => id !== skill.id)
                                    : [...field.value, skill.id],
                                )
                              }
                            />
                            {skill.name}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            )}
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend>Preferences</FieldLegend>
          <FieldGroup className="gap-4 sm:grid sm:grid-cols-3">
            <Controller
              control={control}
              name="desiredRoles"
              render={({ field, fieldState }) => (
                <Field className="gap-1" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Desired roles</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="Frontend Developer, Data Analyst"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>Separate with commas, up to 5.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="preferredSalaryMin"
              render={({ field, fieldState }) => (
                <Field className="gap-1" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Minimum salary (฿/month)</FieldLabel>
                  <Input
                    id={field.name}
                    inputMode="numeric"
                    placeholder="30000"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="preferredWorkArrangement"
              render={({ field }) => (
                <Field className="gap-1">
                  <FieldLabel htmlFor={field.name}>Work arrangement</FieldLabel>
                  <select
                    id={field.name}
                    className="h-11 rounded-xl border border-border bg-muted px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                    {...field}
                  >
                    <option value="">No preference</option>
                    {Object.entries(WORK_ARRANGEMENT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>

        {saved && !isDirty && (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Profile saved. Your match scores are updated.</AlertTitle>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={isPending || !isDirty} className="sm:justify-self-start">
          {isPending ? "Saving..." : "Save profile"}
        </Button>
      </FieldGroup>
    </form>
  );
}
