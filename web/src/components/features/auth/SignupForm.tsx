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
import { ArrowRight, Building2, Check, UserRound } from "lucide-react";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

type FieldName = Extract<
  keyof SignupInput,
  "name" | "email" | "password" | "confirmPassword"
>;

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

const ROLE_OPTIONS = [
  {
    value: "CANDIDATE" as const,
    label: "I'm looking for work",
    description: "Create a profile and explore roles.",
    icon: UserRound,
  },
  {
    value: "RECRUITER" as const,
    label: "I'm hiring",
    description: "Post roles and review candidates.",
    icon: Building2,
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

      if (result.code === "EMAIL_TAKEN") {
        setError("email", { message: result.message });
        return;
      }
      setError("root", { message: result.message });
    });
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup className="auth-form-fields gap-5">
        {errors.root?.message && <FormAlert message={errors.root.message} />}

        <Controller
          control={control}
          name="accountType"
          render={({ field }) => (
            <Field className="gap-2">
              <div>
                <FieldLabel required>I&apos;m joining as</FieldLabel>
                <p className="mt-1 text-sm text-muted-foreground">Choose one to continue.</p>
              </div>

              <div className="grid gap-3 pt-1 sm:grid-cols-2">
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = field.value === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      aria-pressed={isSelected}
                      className={`group relative min-h-28 rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                        isSelected
                          ? "border-brand bg-brand-soft text-navy"
                          : "border-border/80 bg-background text-foreground hover:border-brand/35 hover:bg-muted/40"
                      }`}
                    >
                      <span
                        className={`grid size-10 place-items-center rounded-xl transition ${
                          isSelected
                            ? "bg-brand text-brand-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-brand-soft group-hover:text-brand"
                        }`}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="mt-3 block text-sm font-semibold tracking-tight">
                        {option.label}
                      </span>
                      <span className="mt-1 block max-w-[17rem] text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </span>
                      {isSelected && (
                        <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-brand text-brand-foreground">
                          <Check aria-hidden="true" className="size-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
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
                <Field className="gap-2" data-invalid={fieldState.invalid}>
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

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="mt-1 w-full rounded-2xl"
        >
          {isPending ? "Creating account..." : "Create account"}
          {!isPending && <ArrowRight aria-hidden="true" />}
        </Button>
      </FieldGroup>
    </form>
  );
}
