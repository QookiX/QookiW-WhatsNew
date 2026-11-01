import type { SVGProps } from 'react'
import type { EntryKind } from '../lib/types'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconGithub = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
)

export const IconArrowUpRight = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" />
  </Base>
)

export const IconArrowRight = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.5 8h11M9.5 4l4 4-4 4" />
  </Base>
)

export const IconSearch = ({ size = 14, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    aria-hidden="true"
    {...rest}
  >
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" />
  </svg>
)

export const IconStar = ({ size = 13, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" aria-hidden="true" {...rest}>
    <path d="M8 1.8l1.85 3.9 4.15.53-3.05 2.9.77 4.17L8 11.3l-3.72 2-0.77-4.17L.46 6.23 4.6 5.7z" />
  </svg>
)

export const IconSparkle = (props: IconProps) => (
  <Base {...props}>
    <path d="M8 1.8v3.1M8 11.1v3.1M1.8 8h3.1M11.1 8h3.1" />
    <path d="M3.9 3.9 6 6M10 10l2.1 2.1M12.1 3.9 10 6M6 10l-2.1 2.1" opacity="0.55" />
  </Base>
)

export const IconWrench = (props: IconProps) => (
  <Base {...props}>
    <path d="M10.6 2.2a3.2 3.2 0 0 0-3.9 4.1L2.5 10.5a1.55 1.55 0 0 0 2.2 2.2l4.2-4.2a3.2 3.2 0 0 0 4.1-3.9l-2 2-1.9-.4-.4-1.9z" />
  </Base>
)

export const IconGauge = (props: IconProps) => (
  <Base {...props}>
    <path d="M2 12a6 6 0 1 1 12 0" />
    <path d="M8 12 10.6 7" />
  </Base>
)

export const IconMinus = (props: IconProps) => (
  <Base {...props}>
    <path d="M3.2 8h9.6" />
  </Base>
)

export const IconDot = (props: IconProps) => (
  <Base {...props}>
    <circle cx="8" cy="8" r="2.4" />
  </Base>
)

export const IconX = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Base>
)

export const IconDownload = (props: IconProps) => (
  <Base {...props}>
    <path d="M8 2.4v7.2M5.2 7l2.8 2.8L10.8 7" />
    <path d="M2.8 11.4v1.4a1 1 0 0 0 1 1h8.4a1 1 0 0 0 1-1v-1.4" />
  </Base>
)

export const IconFile = (props: IconProps) => (
  <Base {...props}>
    <path d="M9 2H4.6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6.8a1 1 0 0 0 1-1V5.4z" />
    <path d="M9 2v3.4h3.4" />
  </Base>
)

export const IconChevronDown = ({ size = 14, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    <path d="m4 6 4 4 4-4" />
  </svg>
)

export const IconCookie = ({ size = 26, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    <path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4.5-4A4 4 0 0 1 12 3z" />
    <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="14" cy="14" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="9.5" cy="15.5" r="0.7" fill="currentColor" stroke="none" />
  </svg>
)

export const KIND_ICON: Record<EntryKind, (props: IconProps) => JSX.Element> = {
  feat: IconSparkle,
  fix: IconWrench,
  wip: IconGauge,
  drop: IconMinus,
  other: IconDot,
}

export const KIND_LABEL: Record<EntryKind, string> = {
  feat: '新增',
  fix: '修复',
  wip: '调整',
  drop: '移除',
  other: '变更',
}
