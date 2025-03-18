export interface Player {
  uid: string;
  displayName: string;
  photoURL?: string;
  isSelf: boolean;
  isFinished: boolean;
}
