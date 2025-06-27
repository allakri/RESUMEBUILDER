"use client";

interface ProgressCircleProps {
  progress: number;
}

export function ProgressCircle({ progress }: ProgressCircleProps) {
    const circumference = 2 * Math.PI * 28;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative h-20 w-20 mx-auto">
            <svg className="transform -rotate-90" width="80" height="80">
                <circle
                    className="text-sidebar-accent"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="28"
                    cx="40"
                    cy="40"
                />
                <circle
                    className="text-sidebar-primary"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    r="28"
                    cx="40"
                    cy="40"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-sidebar-foreground">
                {progress}%
            </span>
        </div>
    );
}
