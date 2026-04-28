import type { SelectHTMLAttributes, Ref } from "react";
import { forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select(props, ref: Ref<HTMLSelectElement>) {
    return (
      <select
        ref={ref}
        {...props}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
      />
    );
  },
);
