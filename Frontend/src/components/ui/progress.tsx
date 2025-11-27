"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  value?: number;
  className?: string;
};

function Progress({ className, value, ...props }: ProgressProps) {
  const [internal, setInternal] = React.useState<number>(0);

  // animate smoothly every time "value" changes
  React.useEffect(() => {
    requestAnimationFrame(() => {
      setInternal(value || 0);
    });
  }, [value]);

  return (
    <ProgressPrimitive.Root
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="bg-primary h-full transition-transform duration-300 ease-linear"
        style={{ transform: `translateX(-${100 - internal}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
