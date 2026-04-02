interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Amr Salah Barber Shop"
      className={`${sizeMap[size]} object-contain ${className}`}
    />
  )
}
