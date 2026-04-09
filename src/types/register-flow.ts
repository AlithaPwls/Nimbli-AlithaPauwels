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
