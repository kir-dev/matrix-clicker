import type { ComponentProps, FC, PropsWithChildren } from "react"
import { cn } from "./cn.ts"

export const Button: FC<ComponentProps<"button"> & PropsWithChildren> = ({
  children,
  className,
  ...props
}) => (
  <button
    className={cn(
      "bg-[#f15a29] hover:bg-[#c53b0d] text-white font-bold py-2 px-4 rounded",
      className,
    )}
    {...props}
  >
    {children}
  </button>
)
