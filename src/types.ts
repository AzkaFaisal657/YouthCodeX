export type BrainMode = "scattered" | "foggy" | "mixed";
export type StallType = "freeze" | "midtask-drift" | "both";

export interface Profile {
  brainMode: BrainMode;
  crashTime: string;
  stallType: StallType;
  notes: string;
  createdAt: string;
}

export interface Recommendation {
  soundType: "brown" | "pink" | "binaural";
  soundReason: string;
  microAction: string;
  framing: string;
}

export interface OnboardingTurn {
  question: string;
  answer: string;
}