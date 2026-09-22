import type { SVGProps } from "react";

/** Original HEG glyphs: a shared 48-unit engineering grid with cut corners. */
export function CompassIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: string }) {
  const artwork: Record<string, React.ReactNode> = {
    Customers: (
      <>
        <path d="M9 36V16l14-6v26M23 19l15-5v22M6 37h36" />
        <path d="M14 20h4m-4 7h4m10-4h5m-5 7h5" />
        <path d="M18 37v-5h5" />
      </>
    ),
    Sites: (
      <>
        <path d="m7 31 17 10 17-10-9-5M7 31l9-5" />
        <path d="M34 18c0 8-10 15-10 15S14 26 14 18a10 10 0 0 1 20 0Z" />
        <circle cx="24" cy="18" r="3" />
      </>
    ),
    "Site Assessments": (
      <>
        <path d="M17 10H10v30h27V10h-7M18 7h11v8H18z" />
        <path d="m16 25 5 5 11-11M16 35h15" />
      </>
    ),
    Equipment: (
      <>
        <path d="M6 16h25v17H6zM31 22h7l5 7v4H31M35 22v7h8M10 11h17" />
        <circle cx="14" cy="35" r="4" />
        <circle cx="35" cy="35" r="4" />
        <path d="M11 21h15" />
      </>
    ),
    "Bids / RFPs": (
      <>
        <path d="M11 7h19l8 8v26H11zM29 7v10h9M17 23h13M17 28h8" />
        <path d="m25 34 3 3 7-7" />
      </>
    ),
    "Refused Loads": (
      <>
        <path d="m8 16 16-8 16 8v17l-16 8-16-8ZM8 16l16 8 16-8M24 24v17M16 12l16 8" />
        <path d="m15 27 6 6m0-6-6 6" />
      </>
    ),
    Safety: (
      <>
        <path d="m24 6 15 6v12c0 8-15 17-15 17S9 32 9 24V12Z" />
        <path d="m16 24 6 6 11-13" />
      </>
    ),
    Documents: (
      <>
        <path d="M7 14h13l4 5h17l-4 20H7ZM7 14V9h15l4 5h12v5" />
        <path d="M14 27h17M14 32h11" />
      </>
    ),
    Knowledge: (
      <>
        <path d="M24 13c-5-4-11-5-18-4v27c7-1 13 0 18 4 5-4 11-5 18-4V9c-7-1-13 0-18 4v27" />
        <path d="m12 18 6 2m-6 5 6 2m12-7 6-2m-6 9 6-2" />
      </>
    ),
    Tasks: (
      <>
        <path d="M13 7h26v34H13M8 16l3 3 6-7M8 28l3 3 6-7M23 16h10M23 28h10M23 35h6" />
      </>
    ),
    Reporting: (
      <>
        <path d="M8 7v33h33M14 33V23h5v10M24 33V17h5v16M34 33V10h5v23" />
        <path d="m13 16 10-7 5 3 10-7" />
      </>
    ),
    Settings: (
      <>
        <path d="M8 12h32M8 24h32M8 36h32" />
        <path d="M15 7h7v10h-7zM29 19h7v10h-7zM12 31h7v10h-7z" fill="var(--glyph-bg, #fff)" />
      </>
    ),
    Compass: (
      <>
        <path d="m24 5 19 19-19 19L5 24Z" />
        <path d="m31 17-4 10-10 4 4-10Z" fill="currentColor" />
        <path d="M24 5v6m19 13h-6M24 43v-6M5 24h6" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {artwork[name] ?? artwork["Compass"]}
    </svg>
  );
}
