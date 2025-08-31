export interface PresetConfig {
  id: string;
  name: string;
  actions: string[];
  consumptions: string[];
  intensities?: Record<string, number>;
}
