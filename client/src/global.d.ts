interface WindowConfig {
  readonly API_BASE_URL: string
  readonly WS_BASE_URL: string
}

interface Window {
  config: WindowConfig
}
