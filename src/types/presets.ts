export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  actions: string[];
  consumptions: string[];
  intensities?: Record<string, number>;
}
