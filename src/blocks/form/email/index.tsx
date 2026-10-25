import type { EmailField } from "@payloadcms/plugin-form-builder/types"
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from "react"

import { Error } from "@/blocks/form/error/index"
import { Width } from "@/blocks/form/width/index"

export const Email: React.FC<
  EmailField & {
    errors: Partial<FieldErrorsImpl>
    register: UseFormRegister<FieldValues>
  }
> = ({ name, defaultValue, errors, label, register, required, width }) => {
  return (
    <Width width={width}>
      <Label htmlFor={name}>
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
