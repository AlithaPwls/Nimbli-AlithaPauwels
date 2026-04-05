export type ProfileRowRef = {
  id: string
  firstname: string
  lastname: string
}

export type RegisterOuderLocationState = {
  inviteCode: string
  childProfile: ProfileRowRef
  parentProfile: ProfileRowRef
}
