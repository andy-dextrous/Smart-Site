import type { EmailField } from "@payloadcms/plugin-form-builder/types"
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from "react"

import { Error } from "../error"
import { Width } from "../width"

export const Email: React.FC<
  EmailField & {
    errors: Partial<FieldErrorsImpl>
    register: UseFormRegister<FieldValues>
    variant?: string
  }
> = ({ name, defaultValue, errors, label, register, required, width, variant }) => {
  return (
    <Width width={width}>
      <Label htmlFor={name} variant={variant as any}>
        {label}

        {required && (
          <span className="required">
            * <span className="sr-only">(required)</span>
          </span>
        )}
      </Label>
      <Input
        defaultValue={defaultValue}
        id={name}
        type="email"
        variant={variant as any}
        {...register(name, {
          pattern: {
            message: "Please enter a valid email",
            value: /\S+@\S+\.\S+/,
          },
          required,
        })}
      />
      {errors[name] && <Error name={name} />}
    </Width>
  )
}
