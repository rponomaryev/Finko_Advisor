import type { SelectHTMLAttributes, TextareaHTMLAttributes, InputHTMLAttributes, WheelEvent } from "react";
import { cn } from "@/lib/utils/cn";

const fieldClass = "w-full rounded-finko-button border border-finko-border bg-white px-3 text-sm outline-none transition focus:border-finko-primary focus:ring-2 focus:ring-pink-100";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { onWheel, type, ...rest } = props;
  const handleWheel = (event: WheelEvent<HTMLInputElement>) => {
    onWheel?.(event);
    if (event.defaultPrevented) return;
    if (type === "number" && document.activeElement === event.currentTarget) {
      // Browser number inputs change value on wheel while focused. Blur before the
      // default wheel action so the page can still scroll and the controlled value
      // is not silently incremented/decremented.
      event.currentTarget.blur();
    }
  };
  return <input {...rest} type={type} onWheel={handleWheel} className={cn("h-11", fieldClass, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-28 resize-y py-3", fieldClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("h-11", fieldClass, props.className)} />;
}
