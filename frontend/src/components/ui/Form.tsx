import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { useId } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/cn';

const CONTROL_BASE =
  'w-full rounded-xl border bg-white px-3 py-2 text-sm text-ink placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

const controlTone = (hasError?: boolean) =>
  hasError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 hover:border-gray-300';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[11px] font-semibold text-gray-600">
        {label}
        {required ? <span className="ml-0.5 text-accent">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'prefix'> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  /** Static adornment rendered inside the control, e.g. a ₹ symbol. */
  leading?: ReactNode;
}

export function TextInput({ label, error, hint, className, required, leading, ...props }: TextInputProps) {
  const id = useId();

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}>
      <div className="relative flex items-center">
        {leading ? (
          <span className="pointer-events-none absolute left-3 text-xs font-medium text-gray-400">
            {leading}
          </span>
        ) : null}
        <input
          id={id}
          className={cn(CONTROL_BASE, controlTone(Boolean(error)), leading && 'pl-8')}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
    </Field>
  );
}

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

export function TextArea({ label, error, hint, className, required, ...props }: TextAreaProps) {
  const id = useId();

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={id}
        rows={3}
        className={cn(CONTROL_BASE, controlTone(Boolean(error)), 'resize-y')}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectInputProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children'> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  className?: string;
  placeholder?: string;
}

export function SelectInput({
  label,
  options,
  error,
  hint,
  className,
  required,
  placeholder,
  ...props
}: SelectInputProps) {
  const id = useId();

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        <select
          id={id}
          className={cn(CONTROL_BASE, controlTone(Boolean(error)), 'appearance-none pr-9')}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </Field>
  );
}

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string;
}

/** The rounded search pill from the reference header and list toolbars. */
export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400" />
      <input
        type="search"
        className="w-full rounded-full border border-transparent bg-white/80 py-2 pl-10 pr-4 text-sm placeholder-gray-400 backdrop-blur-sm transition focus:border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10"
        {...props}
      />
    </div>
  );
}

interface FilterSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children'> {
  options: SelectOption[];
  placeholder: string;
  className?: string;
}

/** Compact pill-shaped select used in list toolbars. */
export function FilterSelect({ options, placeholder, className, ...props }: FilterSelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="w-full appearance-none rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10"
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
    </div>
  );
}
