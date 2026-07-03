import { CustomGroupPull, ValidationResult } from '@/types/customGroups';

export interface FormState {
  label: string;
  type: string;
  localGameMode: string;
  selectedTemplateIndex: number;
  intensityLabels: string[];
}

export interface DialogState {
  selectedTab: number;
  isLoading: boolean;
  currentEditingGroup: CustomGroupPull | null;
  validation: ValidationResult;
  isSubmitting: boolean;
}

export interface ManageTabProps {
  existingGroups: CustomGroupPull[];
  defaultGroups: CustomGroupPull[];
  loadingGroups: boolean;
  tileCounts: Record<string, number>;
  onEditGroup: (group: CustomGroupPull) => void;
  onDeleteGroup: (groupId: string) => void;
  onExtendGroup: (group: CustomGroupPull) => void;
}

export interface CreateEditTabProps {
  formState: FormState;
  validation: ValidationResult;
  currentEditingGroup: CustomGroupPull | null;
  locale: string;
  onFormStateChange: (updates: Partial<FormState>) => void;
  generateGroupName: (label: string) => string;
  updateIntensityLabel: (index: number, label: string) => void;
  addIntensity: () => void;
  removeIntensity: (index: number) => void;
  handleTemplateChange: (templateIndex: number) => void;
}

export interface DeleteDialogProps {
  open: boolean;
  pendingDeleteGroup: {
    id: string;
    name: string;
    tileCount: number;
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}
