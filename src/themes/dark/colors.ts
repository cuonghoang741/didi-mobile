import palette from '../palette';

const text = {
  primary: palette.grayDark[50],
  primary_on_brand: palette.grayDark[50],

  secondary: palette.grayDark[300],
  secondary_hover: palette.grayDark[200],
  secondary_on_brand: palette.grayDark[300],

  tertiary: palette.grayDark[400],
  tertiary_hover: palette.grayDark[300],
  tertiary_on_brand: palette.grayDark[400],

  quaternary: palette.grayDark[400],
  quaternary_on_brand: palette.grayDark[400],

  white: palette.white,
  disabled: palette.grayDark[500],
  placeholder: palette.grayDark[400],
  placeholder_subtle: palette.grayDark[700],

  brand_primary: palette.grayDark[50],
  brand_secondary: palette.grayDark[300],
  brand_tertiary: palette.grayDark[400],
  brand_tertiary_alt: palette.grayDark[50],

  error_primary: palette.error[400],
  warning_primary: palette.warning[400],
  success_primary: palette.success[400],
} as const;

const border = {
  primary: palette.grayDark[700],
  secondary: palette.grayDark[800],
  tertiary: palette.grayDark[800],

  disabled: palette.grayDark[700],
  disabled_subtle: palette.grayDark[800],

  brand: palette.brand[400],
  brand_alt: palette.grayDark[700],

  border_error: palette.error[400],
  border_error_subtle: palette.error[400],
} as const;

const foreground = {
  primary: palette.white,
  secondary: palette.grayDark[300],
  secondary_hover: palette.grayDark[200],

  tertiary: palette.grayDark[400],
  tertiary_hover: palette.grayDark[300],

  quaternary: palette.grayDark[400],
  quaternary_hover: palette.grayDark[300],

  quinary: palette.grayDark[500],
  quinary_hover: palette.grayDark[400],

  senary: palette.grayDark[600],

  white: palette.white,
  disabled: palette.grayDark[500],
  disabled_subtle: palette.grayDark[600],

  brand_primary: palette.brand[500],
  brand_primary_alt: palette.grayDark[300],
  brand_secondary: palette.brand[500],

  error_primary: palette.error[500],
  error_secondary: palette.error[400],
  warning_primary: palette.warning[500],
  warning_secondary: palette.warning[400],
  success_primary: palette.success[500],
  success_secondary: palette.success[400],
} as const;

const background = {
  primary: palette.grayDark[950],
  primary_alt: palette.grayDark[900],
  primary_hover: palette.grayDark[800],

  primary_solid: palette.grayDark[900],

  secondary: palette.grayDark[900],
  secondary_alt: palette.grayDark[950],
  secondary_hover: palette.grayDark[800],
  secondary_subtle: palette.grayDark[900],

  secondary_solid: palette.grayDark[600],

  tertiary: palette.grayDark[800],
  quaternary: palette.grayDark[700],

  active: palette.grayDark[800],
  disabled: palette.grayDark[800],
  disabled_subtle: palette.grayDark[900],
  overlay: palette.grayDark[800],

  brand_primary: palette.brand[500],
  brand_primary_alt: palette.grayDark[800],
  brand_secondary: palette.brand[600],
  brand_solid: palette.brand[600],
  brand_solid_hover: palette.brand[500],
  brand_section: palette.grayDark[800],
  brand_section_solid: palette.grayDark[950],

  error_primary: palette.error[500],
  error_secondary: palette.error[600],
  error_solid: palette.error[600],

  warning_primary: palette.warning[500],
  warning_secondary: palette.warning[600],
  warning_solid: palette.warning[600],

  success_primary: palette.success[500],
  success_secondary: palette.success[600],
  success_solid: palette.success[600],
} as const;

const colors = { background, border, foreground, text };

export default colors;
