<?php
// Shared Tailwind config + head assets for VeVit Store
// Usage: include in <head>
$vvBase = defined('VEVIT_BASE') ? VEVIT_BASE : '';
?>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= $vvBase ?>assets/css/style.css">
<link rel="icon" href="<?= $vvBase ?>images/icon.ico" type="image/x-icon">
<script id="tailwind-config">
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Surface hierarchy */
        "surface":                    "#131313",
        "surface-dim":                "#0f1117",
        "surface-bright":             "#3a3939",
        "surface-container-lowest":   "#0e0e0e",
        "surface-container-low":      "#1a1a1a",
        "surface-container":          "#201f1f",
        "surface-container-high":     "#2a2a2a",
        "surface-container-highest":  "#353534",
        "surface-variant":            "#353534",
        /* Text */
        "on-surface":                 "#e5e2e1",
        "on-surface-variant":         "#bbcabf",
        /* Borders */
        "outline":                    "#86948a",
        "outline-variant":            "#3c4a42",
        /* Primary */
        "primary":                    "#4edea3",
        "on-primary":                 "#003824",
        "primary-container":          "#10b981",
        "on-primary-container":       "#00422b",
        "primary-fixed":              "#6ffbbe",
        "primary-fixed-dim":          "#4edea3",
        "on-primary-fixed":           "#002113",
        "on-primary-fixed-variant":   "#005236",
        /* Secondary */
        "secondary":                  "#bdc7d9",
        "on-secondary":               "#27313f",
        "secondary-container":        "#404a59",
        "on-secondary-container":     "#afb9cb",
        /* Tertiary */
        "tertiary":                   "#c6c6c7",
        "on-tertiary":                "#2f3131",
        "tertiary-container":         "#a2a3a3",
        /* Error */
        "error":                      "#f87171",
        "on-error":                   "#690005",
        "error-container":            "#93000a",
        /* Warning */
        "warning":                    "#fb923c",
        "warning-container":          "#431a00",
        /* Success */
        "success":                    "#4ade80",
        /* Background */
        "background":                 "#131313",
        "on-background":              "#e5e2e1",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        sm:  "0.375rem",
        md:  "0.625rem",
        lg:  "0.875rem",
        xl:  "1.25rem",
        "2xl": "1.75rem",
        full:"9999px"
      },
      spacing: {
        xs:     "4px",
        sm:     "12px",
        base:   "8px",
        md:     "24px",
        lg:     "48px",
        xl:     "80px",
        margin: "32px",
        gutter: "24px"
      },
      fontFamily: {
        "display":   ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        "h1":        ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        "h2":        ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        "body-lg":   ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        "body-md":   ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        "caption":   ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        "mono-label":['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        "sans":      ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        "mono":      ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        "display":    ["48px", { lineHeight: "1.1",  letterSpacing: "-0.02em", fontWeight: "800" }],
        "h1":         ["32px", { lineHeight: "1.2",  fontWeight: "700" }],
        "h2":         ["22px", { lineHeight: "1.35", fontWeight: "700" }],
        "body-lg":    ["18px", { lineHeight: "1.65", fontWeight: "400" }],
        "body-md":    ["16px", { lineHeight: "1.65", fontWeight: "400" }],
        "mono-label": ["13px", { lineHeight: "1.0",  letterSpacing: "0.05em", fontWeight: "600" }],
        "caption":    ["12px", { lineHeight: "1.4",  fontWeight: "500" }]
      },
      boxShadow: {
        "neo": "4px 4px 0px 0px #10b981",
        "neo-hover": "6px 6px 0px 0px #10b981",
        "neo-active": "2px 2px 0px 0px #10b981",
      },
      maxWidth: {
        "store": "1280px",
      }
    }
  }
};
</script>
