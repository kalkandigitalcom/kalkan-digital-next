"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { idleState, type ActionState } from "@/lib/action-state";
import { cn } from "@/lib/cn";
import { useToast } from "./toast";
import { buttonClass } from "./button";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
const FormCtx = createContext<{ state: ActionState; pending: boolean }>({ state: idleState, pending: false });

export function useFormState() {
  return useContext(FormCtx);
}
export function useFieldError(name: string) {
  const { state } = useContext(FormCtx);
  return state.status === "error" ? state.fieldErrors?.[name] : undefined;
}

/**
 * Client form wrapper around a server action. Submits via a transition (no automatic
 * form reset, so user input survives validation errors), shows toasts and field errors.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
  silent = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: (state: Extract<ActionState, { status: "success" }>) => void;
  silent?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, idleState);
  const ref = useRef<HTMLFormElement>(null);
  const { push } = useToast();
  const lastAt = useRef<number>(0);

  useEffect(() => {
    if (state.status === "idle" || state.at === lastAt.current) return;
    lastAt.current = state.at;
    if (state.status === "success") {
      if (!silent) push("success", state.message);
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
    } else {
      push("error", state.message);
      const firstError = state.fieldErrors ? Object.keys(state.fieldErrors)[0] : undefined;
      if (firstError) ref.current?.querySelector<HTMLElement>(`[name="${CSS.escape(firstError)}"]`)?.focus();
    }
  }, [state, push, resetOnSuccess, onSuccess, silent]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) fd.set(submitter.name, submitter.value);
    startTransition(() => formAction(fd));
  }

  return (
    <FormCtx.Provider value={{ state, pending }}>
      <form ref={ref} onSubmit={handleSubmit} className={className} noValidate>
        {state.status === "error" && state.fieldErrors?._form ? (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.fieldErrors._form}
          </p>
        ) : null}
        {children}
      </form>
    </FormCtx.Provider>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Parameters<typeof buttonClass>[0]; size?: Parameters<typeof buttonClass>[1] }) {
  const { pending } = useFormState();
  return (
    <button type="submit" disabled={pending || props.disabled} className={buttonClass(variant, size, className)} {...props}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

const inputBase =
  "block w-full rounded-lg border bg-white px-3 text-sm text-navy-900 placeholder:text-navy-300 shadow-xs transition-colors focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100 disabled:bg-navy-50 disabled:text-navy-400";

export function inputClass(hasError?: boolean, className?: string) {
  return cn(inputBase, "h-10", hasError ? "border-red-400" : "border-navy-200", className);
}

function FieldShell({
  name,
  label,
  hint,
  required,
  className,
  children,
}: {
  name: string;
  label?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const error = useFieldError(name);
  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <label htmlFor={`f-${name}`} className="mb-1.5 block text-xs font-semibold text-navy-700">
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`f-${name}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-navy-400">{hint}</p>
      ) : null}
    </div>
  );
}

type Common = { name: string; label?: ReactNode; hint?: ReactNode; className?: string };

export function TextField({ name, label, hint, className, required, ...props }: Common & Omit<ComponentProps<"input">, "name">) {
  const error = useFieldError(name);
  return (
    <FieldShell name={name} label={label} hint={hint} required={required} className={className}>
      <input
        id={`f-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `f-${name}-error` : undefined}
        className={inputClass(!!error)}
        {...props}
      />
    </FieldShell>
  );
}

export function MoneyField(props: Common & Omit<ComponentProps<"input">, "name">) {
  return <TextField inputMode="decimal" autoComplete="off" placeholder="0,00" {...props} />;
}

export function TextareaField({ name, label, hint, className, required, rows = 4, ...props }: Common & Omit<ComponentProps<"textarea">, "name">) {
  const error = useFieldError(name);
  return (
    <FieldShell name={name} label={label} hint={hint} required={required} className={className}>
      <textarea
        id={`f-${name}`}
        name={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(inputBase, "py-2", error ? "border-red-400" : "border-navy-200")}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  className,
  required,
  options,
  placeholder,
  ...props
}: Common &
  Omit<ComponentProps<"select">, "name"> & {
    options: readonly { value: string; label: string }[];
    placeholder?: string;
  }) {
  const error = useFieldError(name);
  return (
    <FieldShell name={name} label={label} hint={hint} required={required} className={className}>
      <select id={`f-${name}`} name={name} aria-invalid={error ? true : undefined} className={inputClass(!!error, "pr-8")} {...props}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({ name, label, hint, className, ...props }: Common & Omit<ComponentProps<"input">, "name" | "type">) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <input id={`f-${name}`} type="checkbox" name={name} className="mt-0.5 size-4 rounded border-navy-300 accent-brand-600" {...props} />
      <div>
        <label htmlFor={`f-${name}`} className="text-sm font-medium text-navy-800">
          {label}
        </label>
        {hint ? <p className="text-xs text-navy-400">{hint}</p> : null}
      </div>
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-navy-100 py-6 first:pt-0 last:border-0 lg:grid-cols-3">
      <div>
        <h2 className="font-display text-sm font-semibold text-navy-900">{title}</h2>
        {description ? <p className="mt-1 text-xs text-navy-500">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">{children}</div>
    </section>
  );
}
