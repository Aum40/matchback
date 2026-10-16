"use client";

import FormAlert from "@/components/features/auth/FormAlert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { registerAction } from "@/lib/actions/auth.action";
import { SignupInput, signupSchema } from "@/lib/schemas/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

type FieldName = Extract<keyof SignupInput, "name" | "email" | "password" | "confirmPassword">;

const FIELDS: {
  name: FieldName;
  label: string;
  type?: "email";
  autoComplete: string;
  description?: string;
}[] = [
  { name: "name", label: "Name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Password",
    autoComplete: "new-password",
    description:
      "8-72 characters with uppercase, lowercase, a number and a symbol.",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    autoComplete: "new-password",
  },
];

export default function SignupForm() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      accountType: "CANDIDATE",
    },
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit = ({ confirmPassword: _confirm, ...data }: SignupInput) => {
    startTransition(async () => {
      const result = await registerAction(data);
      if (!result) return;

      // อีเมลซ้ำ: ชี้ไปที่ช่องอีเมลตรง ๆ แทน error ลอย ๆ บนฟอร์ม
      if (result.code === "EMAIL_TAKEN") {
        setError("email", { message: result.message });
        return;
      }
      setError("root", { message: result.message });
    });
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="gap-4">
        {errors.root?.message && <FormAlert message={errors.root.message} />}

        {/* ตัวเลือกประเภทบัญชี (Candidate / Recruiter) */}
        <Controller
          control={control}
          name="accountType"
          render={({ field }) => (
            <Field className="gap-1.5">
              <FieldLabel required>I am joining as</FieldLabel>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => field.onChange("CANDIDATE")}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all cursor-pointer ${
                    field.value === "CANDIDATE" || !field.value
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-sm font-semibold">Job Seeker</span>
                  <span className="text-xs opacity-70">Looking for jobs</span>
                </button>

                <button
                  type="button"
                  onClick={() => field.onChange("RECRUITER")}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all cursor-pointer ${
                    field.value === "RECRUITER"
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-sm font-semibold">Employer</span>
                  <span className="text-xs opacity-70">Hiring candidates</span>
                </button>
              </div>
            </Field>
          )}
        />

        {FIELDS.map((config) => (
          <Controller
            key={config.name}
            control={control}
            name={config.name}
            render={({ field, fieldState }) => {
              const InputComponent =
                config.name === "password" || config.name === "confirmPassword"
                  ? PasswordInput
                  : Input;
              return (
                <Field className="gap-1" data-invalid={fieldState.invalid}>
                  <FieldLabel required htmlFor={field.name}>
                    {config.label}
                  </FieldLabel>
                  <InputComponent
                    id={field.name}
                    type={config.type}
                    autoComplete={config.autoComplete}
                    {...field}
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                  />
                  {config.description && !fieldState.invalid && (
                    <FieldDescription>{config.description}</FieldDescription>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
          />
        ))}

        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}