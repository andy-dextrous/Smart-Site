"use client"

import type { Form as PayloadForm } from "@payloadcms/plugin-form-builder/types"
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical"

import { useRouter } from "next/navigation"
import React, { useCallback, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"

import { getClientSideURL } from "@/admin/utilities/get-url"
import RichText from "@/components/fields/rich-text"
import { Button } from "@/components/ui/button"
import { cn } from "@/utilities/ui"

import { fields } from "./fields"

export type FormVariant = "white" | "dark" | "neutral" | "transparent"

export type FormBlockProps = {
  blockName?: string
  blockType?: "formBlock"
  enableIntro: boolean
  form: PayloadForm
  introContent?: SerializedEditorState
  variant?: FormVariant
}

/*************************************************************************/
/*  FORM BUTTON COMPONENT
/*************************************************************************/

type FormButtonProps = React.ComponentProps<typeof Button> & {
  formVariant: FormVariant
}

const FormButton: React.FC<FormButtonProps> = ({ formVariant, ...buttonProps }) => {
  const variantMapping = {
    white: "default" as const,
    dark: "white" as const,
    neutral: "default" as const,
    transparent: "outline" as const,
  }

  return <Button variant={variantMapping[formVariant]} {...buttonProps} />
}

/*************************************************************************/
/*  FORM BLOCK COMPONENT
/*************************************************************************/

export const FormBlock: React.FC<
  {
    id?: string
  } & FormBlockProps
> = props => {
  const {
    enableIntro,
    form: formFromProps,
    form: {
      id: formID,
      confirmationMessage,
      confirmationType,
      redirect,
      submitButtonLabel,
    } = {},
    introContent,
    variant = "white",
  } = props

  const formMethods = useForm<any>({
    defaultValues: formFromProps?.fields || undefined,
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string }>()
  const router = useRouter()

  const onSubmit = useCallback(
    (data: any) => {
      let loadingTimerID: ReturnType<typeof setTimeout>

      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({
              message: res.errors?.[0]?.message || "Internal Server Error",
              status: res.status,
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === "redirect" && redirect?.url) {
            router.push(redirect.url)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: "Something went wrong.",
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType]
  )

  const containerClasses = {
    white: "border-form-light-border bg-white",
    dark: "border-form-dark-border bg-dark",
    neutral: "border-form-neutral-border bg-neutral",
    transparent: "border-form-transparent-border bg-transparent",
  }

  return (
    <div>
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
      )}

      <div className={cn("border p-4 lg:p-6", containerClasses[variant])}>
        <FormProvider {...formMethods}>
          {!isLoading && hasSubmitted && confirmationType === "message" && (
            <RichText data={confirmationMessage} />
          )}

          {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}

          {error && <div>{`${error.status || "500"}: ${error.message || ""}`}</div>}

          {!hasSubmitted && (
            <form id={formID} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
                {formFromProps?.fields?.map((field, index) => {
                  const FieldComponent = fields[field.blockType as keyof typeof fields] as
                    | React.FC<any>
                    | undefined

                  if (!FieldComponent) {
                    console.log("field not found", field)
                    return null
                  }

                  return (
                    <div className="mb-6 last:mb-0" key={index}>
                      <FieldComponent
                        control={control}
                        errors={errors}
                        form={formFromProps}
                        register={register}
                        variant={`form-${variant}`}
                        {...field}
                      />
                    </div>
                  )
                })}
              </div>

              <FormButton
                className="flex w-full items-center justify-center hover:cursor-pointer"
                form={formID}
                formVariant={variant}
                size="md"
                type="submit"
              >
                {submitButtonLabel}
              </FormButton>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  )
}
