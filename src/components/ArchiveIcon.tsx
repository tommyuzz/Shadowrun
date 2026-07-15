interface ArchiveIconProps {
  variant?: string;
  className?: string;
}

/** Exact SVG marks used by the original individual archive pages. */
export function ArchiveIcon({ variant = "archive", className = "brand-mark" }: ArchiveIconProps) {
  const common = { className, viewBox: "0 0 100 100", "aria-hidden": true } as const;

  switch (variant) {
    case "skills":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4"/><path d="M50 5v18M50 77v18M5 50h18M77 50h18" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M33 61 45 73 70 39" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="square" strokeLinejoin="miter"/><path d="M31 28h38M27 35h46" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
    case "attributes":
      return <svg {...common}><circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4"/><path d="M50 5v20M50 75v20M5 50h20M75 50h20" fill="none" stroke="currentColor" strokeWidth="4"/><path d="m50 27 23 23-23 23-23-23Z" fill="none" stroke="currentColor" strokeWidth="4"/><circle cx="50" cy="50" r="8" fill="currentColor"/><circle cx="50" cy="18" r="4" fill="currentColor"/><circle cx="82" cy="50" r="4" fill="currentColor"/><circle cx="50" cy="82" r="4" fill="currentColor"/><circle cx="18" cy="50" r="4" fill="currentColor"/></svg>;
    case "metatypes":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="33" r="12" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M24 79c2-21 11-32 26-32s24 11 26 32M16 28h16M68 28h16M50 5v14" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M37 62h26M32 71h36" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
    case "qualities":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4"/><path d="M50 5v16M50 79v16M5 50h16M79 50h16" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M31 39h15V24h8v15h15v8H54v15h-8V47H31z" fill="currentColor"/><path d="M31 72h38" fill="none" stroke="currentColor" strokeWidth="7"/></svg>;
    case "lifestyles":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><path d="m22 48 28-24 28 24v30H22Z" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M14 51 50 19l36 32M42 78V57h16v21" fill="none" stroke="currentColor" strokeWidth="4"/><circle cx="50" cy="47" r="8" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M50 36v5M50 53v5M39 47h5M56 47h5" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
    case "priorityarray":
      return <svg {...common}><circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M20 27h60M20 39h60M20 51h60M20 63h60M20 75h60" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M35 21v60M65 21v60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3"/><path d="M12 27h16M72 75h16" fill="none" stroke="currentColor" strokeWidth="4"/><circle cx="50" cy="27" r="5" fill="currentColor"/><circle cx="50" cy="51" r="5" fill="currentColor"/><circle cx="50" cy="75" r="5" fill="currentColor"/></svg>;
    case "cyberdecks":
      return <svg {...common}><rect x="23" y="23" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="4"/><rect x="37" y="37" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="6" fill="currentColor"/><path d="M50 5v18M50 77v18M5 50h18M77 50h18M19 19l13 13M68 68l13 13M81 19 68 32M32 68 19 81" fill="none" stroke="currentColor" strokeWidth="4"/></svg>;
    case "matrixinteraction":
      return <svg {...common}><circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="9" fill="currentColor"/><circle cx="50" cy="17" r="5" fill="currentColor"/><circle cx="83" cy="50" r="5" fill="currentColor"/><circle cx="50" cy="83" r="5" fill="currentColor"/><circle cx="17" cy="50" r="5" fill="currentColor"/><path d="M50 22v19M59 50h19M50 59v19M22 50h19M27 27l16 16m14 14 16 16m0-46L57 43M43 57 27 73" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
    case "sprites":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M26 34 50 19l24 15v32L50 81 26 66Z" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M26 34 50 49l24-15M50 49v32" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="49" r="7" fill="currentColor"/><circle cx="26" cy="34" r="4" fill="currentColor"/><circle cx="74" cy="34" r="4" fill="currentColor"/><circle cx="50" cy="81" r="4" fill="currentColor"/></svg>;
    case "spells":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4"/><path d="M50 3v25M50 72v25M3 50h25M72 50h25" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M55 25 31 54h17l-5 24 27-38H53z" fill="currentColor"/></svg>;
    case "adeptpowers":
      return <svg {...common}><circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5"/><path d="M50 5v18M50 77v18M5 50h18M77 50h18" fill="none" stroke="currentColor" strokeWidth="3"/><circle className="adept-core" cx="50" cy="29" r="7" fill="currentColor"/><path className="adept-core" d="M50 39c-12 0-19 10-17 22 1 8 7 15 17 25 10-10 16-17 17-25 2-12-5-22-17-22Zm0 10 8 11-8 13-8-13 8-11Z" fill="currentColor"/></svg>;
    case "rituals":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4"/><path d="M50 9 61 38l30 12-30 12-11 29-11-29L9 50l30-12Z" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="8" fill="currentColor"/></svg>;
    case "spirits":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M50 11c15 15 25 28 25 43a25 25 0 0 1-50 0c0-15 10-28 25-43Z" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M50 30c8 10 13 18 13 27a13 13 0 0 1-26 0c0-9 5-17 13-27Z" fill="currentColor"/><path d="M12 50h14M74 50h14M50 5v10M50 85v10" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
    case "weapons":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4"/><path d="M50 4v18M50 78v18M4 50h18M78 50h18" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M28 43h39l8 8-8 8H55l-7 12H36l5-12H28z" fill="currentColor"/><path d="M67 43v16M75 51h11" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
    case "vehicles":
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4"/><path d="M50 4v17M50 79v17M4 50h17M79 50h17" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M22 57h6l8-15h31l12 15v10h-7a10 10 0 0 0-20 0H43a10 10 0 0 0-20 0h-5V60z" fill="currentColor"/><circle cx="33" cy="67" r="6" fill="var(--paper)" stroke="currentColor" strokeWidth="3"/><circle cx="62" cy="67" r="6" fill="var(--paper)" stroke="currentColor" strokeWidth="3"/><path d="M12 36h21M8 43h18M69 35h19" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
    case "drones":
      return <svg {...common}><circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M23 50h14m26 0h14M50 23v14m0 26v14" fill="none" stroke="currentColor" strokeWidth="4"/><rect x="36" y="36" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="7" fill="currentColor"/><path d="M28 28l10 10m24 24 10 10m0-44L62 38M38 62 28 72" fill="none" stroke="currentColor" strokeWidth="3"/></svg>;
    case "equipment":
      return <svg {...common}><path d="M18 31h64l-7 48H25zM30 31l8-14h24l8 14" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M31 47h38M31 59h29" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="34" cy="83" r="5" fill="currentColor"/><circle cx="67" cy="83" r="5" fill="currentColor"/></svg>;
    default:
      return <svg {...common}><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 4"/><path d="M50 3v25M50 72v25M3 50h25M72 50h25" fill="none" stroke="currentColor" strokeWidth="4"/><path d="M37 32h26l10 18-10 18H37L27 50z" fill="none" stroke="currentColor" strokeWidth="5"/><circle cx="50" cy="50" r="7" fill="currentColor"/></svg>;
  }
}
