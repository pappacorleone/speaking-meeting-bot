"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FacilitatorConfig } from "@/types/session";

/**
 * Parameter configuration for display
 */
interface ParameterOption {
  id: keyof Omit<FacilitatorConfig, "persona">;
  label: string;
  description: string;
  defaultValue: boolean;
}

const PARAMETER_OPTIONS: ParameterOption[] = [
  {
    id: "interruptAuthority",
    label: "Interrupt Authority",
    description: "Facilitator may pause speakers to clarify or redirect",
    defaultValue: true,
  },
  {
    id: "directInquiry",
    label: "Direct Inquiry",
    description: "Asks challenging, data-driven questions to both parties",
    defaultValue: true,
  },
  {
    id: "silenceDetection",
    label: "Silence Detection",
    description: "Nudges the room if silence exceeds 20 seconds",
    defaultValue: true,
  },
];

export interface ParameterTogglesProps {
  values: Pick<FacilitatorConfig, "interruptAuthority" | "directInquiry" | "silenceDetection">;
  onChange: (key: keyof Omit<FacilitatorConfig, "persona">, value: boolean) => void;
  disabled?: boolean;
}

/**
 * ParameterToggles - Switch toggles for configuring facilitator behavior
 *
 * Displays three toggle switches for agent parameters:
 * - Interrupt Authority
 * - Direct Inquiry
 * - Silence Detection
 *
 * Reference: requirements.md Section 6.4 Step 2 - Facilitator Calibration
 */
export function ParameterToggles({
  values,
  onChange,
  disabled = false,
}: ParameterTogglesProps) {
  return (
    <div className="space-y-4" role="group" aria-label="Agent parameters">
      {PARAMETER_OPTIONS.map((param) => {
        const isOn = values[param.id];
        const switchId = `param-${param.id}`;

        return (
          <div
            key={param.id}
            className={cn(
              "flex items-start justify-between gap-4 p-4 rounded-lg border",
              "bg-background transition-colors",
              isOn ? "border-primary/30" : "border-input"
            )}
          >
            {/* Label and description */}
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={switchId}
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {param.label}
              </Label>
              <p
                id={`${switchId}-description`}
                className="text-xs text-muted-foreground mt-1"
              >
                {param.description}
              </p>
            </div>

            {/* Switch */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  isOn ? "text-status-active" : "text-muted-foreground"
                )}
              >
                {isOn ? "ON" : "OFF"}
              </span>
              <Switch
                id={switchId}
                checked={isOn}
                onCheckedChange={(checked) => onChange(param.id, checked)}
                disabled={disabled}
                aria-describedby={`${switchId}-description`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { PARAMETER_OPTIONS };
export type { ParameterOption };
