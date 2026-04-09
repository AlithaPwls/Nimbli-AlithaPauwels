/** Row ref from invite lookup; `id` is pending until registration, then equals auth user id. */
export type ProfileRowRef = {
  id: string
  firstname: string
  lastname: string
  email?: string
}

export type RegisterOuderLocationState = {
  inviteCode: string
  childProfile: ProfileRowRef
  parentProfile: ProfileRowRef
}
