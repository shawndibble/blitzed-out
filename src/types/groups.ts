export interface GroupIntensity {
  label: string;
  intensities: Record<string, number>;
}

export interface Groups {
  [key: string]: GroupIntensity;
}
