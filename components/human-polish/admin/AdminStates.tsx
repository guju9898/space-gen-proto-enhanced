import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminForbidden({ message }: { message?: string }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-24">
      <Alert variant="destructive">
        <AlertTitle>Access denied</AlertTitle>
        <AlertDescription>
          {message || "You do not have access to Human Polish operations."}
        </AlertDescription>
      </Alert>
    </main>
  )
}

export function AdminErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
