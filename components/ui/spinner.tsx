import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("inline-flex animate-spin", className)}
      {...props}
    >
      <Loader2Icon className="size-4" aria-hidden="true" />
    </div>
  )
}

export { Spinner }
