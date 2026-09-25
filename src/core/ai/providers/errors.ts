export class SettingsError extends Error {}

export function modelUnavailable(provider: string, model: string, section: string): SettingsError {
  return new SettingsError(
    `${provider} can't find the model "${model}" for this key. It may be retired. Choose another in Settings → ${section}.`,
  )
}
