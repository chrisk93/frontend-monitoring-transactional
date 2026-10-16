import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.scss'

type ButtonVariant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export const Button = ({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) => {
  const classNames = [styles.button, styles[`button--${variant}`], className].filter(Boolean).join(' ')

  return <button type={type} className={classNames} {...props} />
}
