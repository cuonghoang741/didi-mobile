import palette from '../palette';

const text = {
  primary: palette.grayLight[900],
  primary_on_brand: palette.white,

  secondary: palette.grayLight[700],
  secondary_hover: palette.grayLight[800],
  secondary_on_brand: palette.brand[200],

  tertiary: palette.grayLight[600],
  tertiary_hover: palette.grayLight[700],
  tertiary_on_brand: palette.brand[200],

  quaternary: palette.grayLight[500],
  quaternary_on_brand: palette.brand[300],

  white: palette.white,
  disabled: palette.grayLight[500],
  placeholder: palette.grayLight[500],
  placeholder_subtle: palette.grayLight[300],

  brand_primary: palette.brand[900],
  brand_secondary: palette.brand[700],
  brand_tertiary: palette.brand[600],
  brand_tertiary_alt: palette.brand[600],

  error_primary: palette.error[600],
  warning_primary: palette.warning[600],
  success_primary: palette.success[600],
  gray_primary: palette.grayLight[600],
} as const;

const border = {
  primary: palette.grayLight[300],
  secondary: palette.grayLight[200],
  tertiary: palette.grayLight[100],

  disabled: palette.grayLight[300],
  disabled_subtle: palette.grayLight[200],

  brand: palette.brand[500],
  brand_alt: palette.brand[600],

  border_error: palette.error[500],
  border_error_subtle: palette.error[300],

  border_success: palette.success[500],
  border_success_subtle: palette.success[300],

  border_warning: palette.warning[500],
  border_warning_subtle: palette.warning[300],
} as const;

const foreground = {
  primary: palette.grayLight[900],
  secondary: palette.grayLight[700],
  secondary_hover: palette.grayLight[800],

  tertiary: palette.grayLight[600],
  tertiary_hover: palette.grayLight[700],

  quaternary: palette.grayLight[500],
  quaternary_hover: palette.grayLight[600],

  quinary: palette.grayLight[400],
  quinary_hover: palette.grayLight[500],

  senary: palette.grayLight[300],

  white: palette.white,
  disabled: palette.grayLight[400],
  disabled_subtle: palette.grayLight[300],

  brand_primary: palette.brand[600],
  brand_primary_alt: palette.brand[600],
  brand_secondary: palette.brand[500],

  error_primary: palette.error[600],
  error_secondary: palette.error[500],
  warning_primary: palette.warning[600],
  warning_secondary: palette.warning[500],
  success_primary: palette.success[600],
  success_secondary: palette.success[500],
} as const;

const background = {
  primary: '#787878',
  primary_alt: '#787878',
  primary_hover: palette.grayLight[50],
  primary_solid: palette.grayLight[950],

  secondary: palette.grayLight[50],
  secondary_alt: palette.grayLight[50],
  secondary_hover: palette.grayLight[100],
  secondary_subtle: palette.grayLight[25],
  secondary_solid: palette.grayLight[600],

  tertiary: palette.grayLight[100],
  quaternary: palette.grayLight[200],

  active: palette.grayLight[50],
  disabled: palette.grayLight[100],
  disabled_subtle: palette.grayLight[50],
  overlay: palette.grayLight[950],

  brand_primary: palette.brand[50],
  brand_primary_alt: palette.brand[50],
  brand_secondary: palette.brand[100],
  brand_solid: '#4D57FF',
  brand_solid_hover: '#3D4DF4',
  brand_section: palette.brand[800],
  brand_section_solid: palette.brand[700],

  error_primary: palette.error[50],
  error_secondary: palette.error[100],
  error_solid: palette.error[600],

  warning_primary: palette.warning[50],
  warning_secondary: palette.warning[100],
  warning_solid: palette.warning[600],

  success_primary: palette.success[50],
  success_secondary: palette.success[100],
  success_solid: palette.success[600],
} as const;

const colors = { background, border, foreground, text };

export default colors;
