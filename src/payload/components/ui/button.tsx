import { type VariantProps, cva } from "class-variance-authority"
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import "./styles.scss"

// Helper function to generate class names based on variants
const getBEMClasses = (
	variant?: string,
	size?: string,
	className?: string
): string => {
	const classes = ["btn"]

	// Add size modifier
	if (size) {
		classes.push(`btn--size-${size}`)
	}

	// Add variant modifier
	if (variant) {
		classes.push(`btn--variant-${variant}`)
	}

	// Add any additional classes
	if (className) {
		classes.push(className)
	}

	return classes.join(" ")
}

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean
	ref?: React.Ref<HTMLButtonElement>
	size?: "clear" | "default" | "icon" | "lg" | "sm"
	variant?:
		| "default"
		| "destructive"
		| "ghost"
		| "link"
		| "outline"
		| "secondary"
		| "icon"
}

const Button: React.FC<ButtonProps> = ({
	asChild = false,
	className,
	size = "default",
	variant = "default",
	ref,
	...props
}) => {
	const Comp = asChild ? Slot : "button"
	return (
		<Comp
			className={getBEMClasses(variant, size, className)}
			ref={ref}
			{...props}
		/>
	)
}

export { Button }
