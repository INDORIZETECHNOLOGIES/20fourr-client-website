"use client";

import { MoonIcon, SunIcon } from "@/components/dashboard/icons";

/**
 * The app's Light/Dark segmented control.
 *
 * Dark is the only implemented theme — every token in globals.css is a dark
 * value, so selecting Light today would render unreadable text on unreadable
 * ground. The option is shown (to match the app) but disabled rather than wired
 * to a switch that does nothing, which would be worse. Enabling it means
 * defining a light value for each token; see the note in globals.css.
 */
export function AppearanceToggle() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="group"
        aria-label="Appearance"
        className="flex gap-2.5"
      >
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Light theme is not available yet"
          className="flex cursor-not-allowed items-center gap-2 rounded-sm border border-hairline px-5 py-2.5 text-body font-semibold text-fg-faint opacity-60"
        >
          <SunIcon size={17} />
          Light
        </button>

        <button
          type="button"
          aria-pressed="true"
          className="flex items-center gap-2 rounded-sm border border-edge bg-panel-raised px-5 py-2.5 text-body font-medium text-fg"
        >
          <MoonIcon size={17} />
          Dark
        </button>
      </div>

      <p className="text-body-sm text-fg-faint">Light theme coming soon</p>
    </div>
  );
}
