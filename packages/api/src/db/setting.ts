export type Setting<T = unknown> = {
  id: string
  name: SettingName
  value: T | null
  settingRestriction?: SettingRestriction
}

export enum SettingName {
  ALLOW_GUEST_COMMENTING = 'allowGuestCommenting',
  ALLOW_GUEST_COMMENT_RATING = 'allowGuestCommentRating',
  ALLOW_GUEST_POLL_VOTING = 'allowGuestPollVoting',
  SEND_LOGIN_JWT_EXPIRES_MIN = 'sendLoginJwtExpiresMin',
  RESET_PASSWORD_JWT_EXPIRES_MIN = 'resetPasswordJwtExpiresMin',
  PEERING_TIMEOUT_MS = 'peeringTimeoutInMs',
  INVOICE_REMINDER_FREQ = 'invoiceFreqReminder',
  INVOICE_REMINDER_MAX_TRIES = 'invoiceReminderMaxTries'
}

export type SettingInput<T = unknown> = Pick<Setting<T>, 'value'>

export type CreateSettingArgs<T> = Omit<Setting<T>, 'id'>

export type UpdateSettingArgs<T = unknown> = {
  name: SettingName
  value: T
}

export interface SettingRestriction {
  maxValue?: number
  minValue?: number
  inputLength?: number
  allowedValues?: AllowedSettingVals
}

export type AllowedSettingVals = {
  stringChoice?: string[]
  boolChoice?: boolean
}

export type OptionalSetting = Setting | null
