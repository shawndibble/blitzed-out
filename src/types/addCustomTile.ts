export interface FormDataState {
  gameMode: string;
  group: string; // Keep for backward compatibility during migration
  group_id?: string; // New normalized foreign key field
  intensity: string | number;
  action: string;
  tags: string[];
}
