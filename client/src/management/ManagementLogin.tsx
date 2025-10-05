import { useState } from "react"
import { authManagement } from "./requests.ts"
import { Button } from "../common/Button.tsx"
import { LoadingIndicator } from "../common/LoadingIndicator.tsx"

export function ManagementLogin({ setSecret }: { setSecret: (secret: string) => void }) {
  const [loading, setLoading] = useState<boolean>(false)
  const [value, setValue] = useState<string | null>(null)
  const [hasError, setHasError] = useState<boolean>(false)

  return (
    <form
      className="py-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!value) return
        setLoading(true)
        const newSecret = value
        authManagement(newSecret)
          .then((res) => {
            if (res.ok) {
              setSecret(newSecret)
            }
          })
          .catch((err) => {
            setHasError(true)
            console.error(err)
          })
          .finally(() => setLoading(false))
      }}
    >
      <input
        onChange={(e) => {
          setValue(e.target.value)
          setHasError(false)
        }}
        id="password"
        name="password"
        type="password"
        className="block shadow appearance-none border rounded py-2 px-3 mb-3 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="jelszó"
      />
      <Button>Beküldés</Button>
      {hasError && <div>Hibás jelszó</div>}
      {loading && <LoadingIndicator />}
    </form>
  )
}
