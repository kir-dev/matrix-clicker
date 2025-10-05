import {
  type SpringOptions,
  useInView,
  type UseInViewOptions,
  useMotionValue,
  useSpring,
} from "motion/react"
import { type ComponentProps, useEffect, useImperativeHandle, useRef } from "react"

type CountingNumberProps = ComponentProps<"span"> & {
  numberToAnimate: number
  fromNumber?: number
  padStart?: boolean
  inView?: boolean
  inViewMargin?: UseInViewOptions["margin"]
  inViewOnce?: boolean
  decimalSeparator?: string
  transition?: SpringOptions
  decimalPlaces?: number
}

function CountingNumber({
  ref,
  numberToAnimate,
  fromNumber = 0,
  padStart = false,
  inView = false,
  inViewMargin = "0px",
  inViewOnce = true,
  decimalSeparator = ".",
  transition = { stiffness: 100, damping: 10, velocity: 2 },
  decimalPlaces = 0,
  className,
  ...props
}: CountingNumberProps) {
  const localRef = useRef<HTMLSpanElement>(null)
  useImperativeHandle(ref, () => localRef.current as HTMLSpanElement)
  const numberStr = numberToAnimate.toString()
  const decimals =
    typeof decimalPlaces === "number"
      ? decimalPlaces
      : numberStr.includes(".")
        ? (numberStr.split(".")[1]?.length ?? 0)
        : 0
  const motionVal = useMotionValue(fromNumber)
  const springVal = useSpring(motionVal, transition)
  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  })
  const isInView = !inView || inViewResult
  useEffect(() => {
    if (isInView) motionVal.set(numberToAnimate)
  }, [isInView, numberToAnimate, motionVal])
  useEffect(() => {
    const unsubscribe = springVal.on("change", (latest) => {
      if (localRef.current) {
        let formatted = decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()
        if (decimals > 0) {
          formatted = formatted.replace(".", decimalSeparator)
        }
        if (padStart) {
          const finalIntLength = Math.floor(Math.abs(numberToAnimate)).toString().length
          const [intPart, fracPart] = formatted.split(decimalSeparator)
          const paddedInt = intPart?.padStart(finalIntLength, "0") ?? ""
          formatted = fracPart ? `${paddedInt}${decimalSeparator}${fracPart}` : paddedInt
        }
        localRef.current.textContent = formatted
      }
    })
    return () => unsubscribe()
  }, [springVal, decimals, padStart, numberToAnimate, decimalSeparator])
  const finalIntLength = Math.floor(Math.abs(numberToAnimate)).toString().length
  const initialText = padStart
    ? "0".padStart(finalIntLength, "0") +
      (decimals > 0 ? decimalSeparator + "0".repeat(decimals) : "")
    : "0" + (decimals > 0 ? decimalSeparator + "0".repeat(decimals) : "")
  return (
    <span ref={localRef} data-slot="counting-number" className={className} {...props}>
      {initialText}
    </span>
  )
}

export { CountingNumber, type CountingNumberProps }
