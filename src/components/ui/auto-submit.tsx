"use client";

import type { ComponentProps } from "react";

/** A <select> that submits its surrounding GET filter form on change. */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
