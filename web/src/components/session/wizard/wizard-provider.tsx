"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { z } from "zod";
import type { FacilitatorConfig } from "@/types/session";

// =============================================================================
// Zod Validation Schemas
// =============================================================================

export const stepIdentitySchema = z.object({
  partnerName: z
    .string()
    .min(1, "Partner's name is required")
    .max(100, "Name is too long"),
  relationshipContext: z
    .string()
    .min(1, "Relationship context is required")
    .max(500, "Relationship context is too long"),
});

export const stepGoalSchema = z.object({
  goal: z
    .string()
    .min(10, "Goal must be at least 10 characters")
    .max(500, "Goal must be 500 characters or less"),
  scheduledAt: z.string().optional(),
  durationMinutes: z
    .number()
    .min(15, "Minimum session duration is 15 minutes")
    .max(90, "Maximum session duration is 90 minutes"),
});

export const stepFacilitatorSchema = z.object({
  facilitator: z.object({
    persona: z.enum([
      "neutral_mediator",
      "deep_empath",
      "decision_catalyst",
    ] as const),
    interruptAuthority: z.boolean(),
    directInquiry: z.boolean(),
    silenceDetection: z.boolean(),
  }),
});

export const stepLaunchSchema = z.object({
  platform: z.enum(["zoom", "meet", "teams", "diadi"] as const),
  meetingUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

// Combined schema for full form validation
export const sessionWizardSchema = stepIdentitySchema
  .merge(stepGoalSchema)
  .merge(stepFacilitatorSchema)
  .merge(stepLaunchSchema);

export type SessionWizardFormData = z.infer<typeof sessionWizardSchema>;

// =============================================================================
// Step Configuration
// =============================================================================

export interface WizardStepConfig {
  id: number;
  key: string;
  title: string;
  description: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: 0,
    key: "identity",
    title: "Identity & Bond",
    description: "Tell us about your partner and relationship",
  },
  {
    id: 1,
    key: "goal",
    title: "Session Goal",
    description: "What do you want to accomplish?",
  },
  {
    id: 2,
    key: "facilitator",
    title: "Facilitator Calibration",
    description: "Choose your AI facilitator style",
  },
  {
    id: 3,
    key: "review",
    title: "Review & Confirm",
    description: "Review your session details",
  },
  {
    id: 4,
    key: "launch",
    title: "Launch Hub",
    description: "Connect your meeting and invite your partner",
  },
];

// =============================================================================
// Wizard State Types
// =============================================================================

export interface WizardState {
  currentStep: number;
  formData: SessionWizardFormData;
  stepErrors: Record<number, Record<string, string>>;
  isSubmitting: boolean;
  isComplete: boolean;
}

type WizardAction =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; payload: number }
  | { type: "SET_STEP_DATA"; payload: Partial<SessionWizardFormData> }
  | { type: "SET_STEP_ERRORS"; payload: { step: number; errors: Record<string, string> } }
  | { type: "CLEAR_STEP_ERRORS"; payload: number }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_COMPLETE"; payload: boolean }
  | { type: "RESET" };

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_FACILITATOR_CONFIG: FacilitatorConfig = {
  persona: "neutral_mediator",
  interruptAuthority: true,
  directInquiry: true,
  silenceDetection: true,
};

const DEFAULT_FORM_DATA: SessionWizardFormData = {
  // Step 0: Identity & Bond
  partnerName: "",
  relationshipContext: "",
  // Step 1: Session Goal
  goal: "",
  scheduledAt: undefined,
  durationMinutes: 30,
  // Step 2: Facilitator Calibration
  facilitator: DEFAULT_FACILITATOR_CONFIG,
  // Step 4: Launch Hub
  platform: "diadi",
  meetingUrl: "",
};

const INITIAL_STATE: WizardState = {
  currentStep: 0,
  formData: DEFAULT_FORM_DATA,
  stepErrors: {},
  isSubmitting: false,
  isComplete: false,
};

// =============================================================================
// Reducer
// =============================================================================

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, WIZARD_STEPS.length - 1),
      };
    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };
    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: Math.max(0, Math.min(action.payload, WIZARD_STEPS.length - 1)),
      };
    case "SET_STEP_DATA":
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
      };
    case "SET_STEP_ERRORS":
      return {
        ...state,
        stepErrors: {
          ...state.stepErrors,
          [action.payload.step]: action.payload.errors,
        },
      };
    case "CLEAR_STEP_ERRORS": {
      const newStepErrors = { ...state.stepErrors };
      delete newStepErrors[action.payload];
      return {
        ...state,
        stepErrors: newStepErrors,
      };
    }
    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.payload,
      };
    case "SET_COMPLETE":
      return {
        ...state,
        isComplete: action.payload,
      };
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

// =============================================================================
// Context
// =============================================================================

interface WizardContextValue {
  // State
  state: WizardState;
  currentStep: number;
  formData: SessionWizardFormData;
  stepErrors: Record<string, string>;
  isSubmitting: boolean;
  isComplete: boolean;

  // Step info
  currentStepConfig: WizardStepConfig;
  steps: WizardStepConfig[];
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoBack: boolean;
  canGoForward: boolean;

  // Navigation
  nextStep: () => boolean;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Data management
  setStepData: (data: Partial<SessionWizardFormData>) => void;
  setFieldValue: <K extends keyof SessionWizardFormData>(
    field: K,
    value: SessionWizardFormData[K]
  ) => void;

  // Validation
  validateCurrentStep: () => boolean;
  validateStep: (step: number) => boolean;
  getFieldError: (field: string) => string | undefined;

  // Form submission
  setSubmitting: (submitting: boolean) => void;
  setComplete: (complete: boolean) => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

// =============================================================================
// Validation Helpers
// =============================================================================

function getSchemaForStep(step: number): z.ZodType | null {
  switch (step) {
    case 0:
      return stepIdentitySchema;
    case 1:
      return stepGoalSchema;
    case 2:
      return stepFacilitatorSchema;
    case 3:
      // Review step - validate all previous steps
      return stepIdentitySchema.merge(stepGoalSchema).merge(stepFacilitatorSchema);
    case 4:
      return stepLaunchSchema;
    default:
      return null;
  }
}

function extractStepData(
  step: number,
  formData: SessionWizardFormData
): Partial<SessionWizardFormData> {
  switch (step) {
    case 0:
      return {
        partnerName: formData.partnerName,
        relationshipContext: formData.relationshipContext,
      };
    case 1:
      return {
        goal: formData.goal,
        scheduledAt: formData.scheduledAt,
        durationMinutes: formData.durationMinutes,
      };
    case 2:
      return {
        facilitator: formData.facilitator,
      };
    case 3:
      // Review validates steps 0-2
      return {
        partnerName: formData.partnerName,
        relationshipContext: formData.relationshipContext,
        goal: formData.goal,
        scheduledAt: formData.scheduledAt,
        durationMinutes: formData.durationMinutes,
        facilitator: formData.facilitator,
      };
    case 4:
      return {
        platform: formData.platform,
        meetingUrl: formData.meetingUrl,
      };
    default:
      return {};
  }
}

// =============================================================================
// Provider Component
// =============================================================================

interface WizardProviderProps {
  children: ReactNode;
  initialData?: Partial<SessionWizardFormData>;
  initialStep?: number;
}

export function WizardProvider({
  children,
  initialData,
  initialStep = 0,
}: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...INITIAL_STATE,
    currentStep: initialStep,
    formData: {
      ...DEFAULT_FORM_DATA,
      ...initialData,
    },
  });

  // Validate a specific step
  const validateStep = useCallback(
    (step: number): boolean => {
      const schema = getSchemaForStep(step);
      if (!schema) return true;

      const stepData = extractStepData(step, state.formData);
      const result = schema.safeParse(stepData);

      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          errors[path] = issue.message;
        });
        dispatch({ type: "SET_STEP_ERRORS", payload: { step, errors } });
        return false;
      }

      dispatch({ type: "CLEAR_STEP_ERRORS", payload: step });
      return true;
    },
    [state.formData]
  );

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    return validateStep(state.currentStep);
  }, [state.currentStep, validateStep]);

  // Navigate to next step (with validation)
  const nextStep = useCallback((): boolean => {
    if (!validateCurrentStep()) {
      return false;
    }
    dispatch({ type: "NEXT_STEP" });
    return true;
  }, [validateCurrentStep]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  // Navigate to specific step
  const goToStep = useCallback((step: number) => {
    dispatch({ type: "GO_TO_STEP", payload: step });
  }, []);

  // Set partial form data
  const setStepData = useCallback((data: Partial<SessionWizardFormData>) => {
    dispatch({ type: "SET_STEP_DATA", payload: data });
  }, []);

  // Set individual field value
  const setFieldValue = useCallback(
    <K extends keyof SessionWizardFormData>(
      field: K,
      value: SessionWizardFormData[K]
    ) => {
      dispatch({ type: "SET_STEP_DATA", payload: { [field]: value } });
    },
    []
  );

  // Get field error for current step
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return state.stepErrors[state.currentStep]?.[field];
    },
    [state.stepErrors, state.currentStep]
  );

  // Submission state
  const setSubmitting = useCallback((submitting: boolean) => {
    dispatch({ type: "SET_SUBMITTING", payload: submitting });
  }, []);

  const setComplete = useCallback((complete: boolean) => {
    dispatch({ type: "SET_COMPLETE", payload: complete });
  }, []);

  // Reset wizard
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // Derived values
  // We can safely assert non-null because currentStep is always clamped to valid range
  const currentStepConfig = WIZARD_STEPS[state.currentStep] as WizardStepConfig;
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === WIZARD_STEPS.length - 1;
  const canGoBack = !isFirstStep && !state.isSubmitting;
  const canGoForward = !isLastStep && !state.isSubmitting;

  const value = useMemo<WizardContextValue>(
    () => ({
      // State
      state,
      currentStep: state.currentStep,
      formData: state.formData,
      stepErrors: state.stepErrors[state.currentStep] ?? {},
      isSubmitting: state.isSubmitting,
      isComplete: state.isComplete,

      // Step info
      currentStepConfig,
      steps: WIZARD_STEPS,
      isFirstStep,
      isLastStep,
      canGoBack,
      canGoForward,

      // Navigation
      nextStep,
      prevStep,
      goToStep,

      // Data management
      setStepData,
      setFieldValue,

      // Validation
      validateCurrentStep,
      validateStep,
      getFieldError,

      // Form submission
      setSubmitting,
      setComplete,
      reset,
    }),
    [
      state,
      currentStepConfig,
      isFirstStep,
      isLastStep,
      canGoBack,
      canGoForward,
      nextStep,
      prevStep,
      goToStep,
      setStepData,
      setFieldValue,
      validateCurrentStep,
      validateStep,
      getFieldError,
      setSubmitting,
      setComplete,
      reset,
    ]
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}

// =============================================================================
// Step-Specific Hooks (Convenience)
// =============================================================================

export function useWizardNavigation() {
  const { nextStep, prevStep, goToStep, canGoBack, canGoForward, isFirstStep, isLastStep } =
    useWizard();
  return { nextStep, prevStep, goToStep, canGoBack, canGoForward, isFirstStep, isLastStep };
}

export function useWizardFormData() {
  const { formData, setStepData, setFieldValue, getFieldError, stepErrors } = useWizard();
  return { formData, setStepData, setFieldValue, getFieldError, stepErrors };
}

export function useWizardValidation() {
  const { validateCurrentStep, validateStep, stepErrors, getFieldError } = useWizard();
  return { validateCurrentStep, validateStep, stepErrors, getFieldError };
}
