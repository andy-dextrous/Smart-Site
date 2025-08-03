import type {
  FieldErrorsImpl,
  FieldValues,
  UseFormRegister,
  Control,
} from "react-hook-form"
import React from "react"
import { Controller } from "react-hook-form"

import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"

import { Error } from "../error"
import { Width } from "../width"

export interface PhoneField {
  name: string
  defaultValue?: string
  label?: string
  required?: boolean
  width?: number
  blockType: "phone"
}

export const Phone: React.FC<
  PhoneField & {
    control: Control<FieldValues>
    errors: Partial<FieldErrorsImpl>
    register: UseFormRegister<FieldValues>
  }
> = ({ name, defaultValue, errors, label, required, width, control }) => {
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
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue || ""}
        rules={{ required: required ? "This field is required" : false }}
        render={({ field }) => (
          <PhoneInput
            id={name}
            placeholder="Enter phone number"
            value={field.value}
            onChange={field.onChange}
            defaultCountry="AE"
            className="rounded-e-none"
          />
        )}
      />
      {errors[name] && <Error name={name} />}
    </Width>
  )
}
