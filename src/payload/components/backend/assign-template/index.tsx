"use client"

import React, { useState } from "react"
import {
  SelectInput,
  useDocumentInfo,
  usePayloadAPI,
  useForm,
  Button,
} from "@payloadcms/ui"
import { Template } from "@/payload/payload-types"
import "./styles.scss"

/*************************************************************************/
/*  TEMPLATE CONTROL UI FIELD COMPONENT
/*************************************************************************/

export default function TemplateControlUIField() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isApplying, setIsApplying] = useState(false)

  const { addFieldRow, removeFieldRow, getFields } = useForm()

  const [{ data: templatesResponse, isLoading }] = usePayloadAPI("/api/templates", {
    initialParams: {
      limit: 100,
      sort: "name",
    },
  })

  /*************************************************************************/
  /*  TEMPLATE APPLICATION HANDLER - IDENTICAL TO CONTROL BUTTON
  /*************************************************************************/

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || isApplying) return

    setIsApplying(true)

    try {
      const templates = templatesResponse?.docs || []
      const template = templates.find((t: Template) => t.id === selectedTemplate)

      if (!template?.sections || !Array.isArray(template.sections)) {
        setSelectedTemplate("")
        return
      }

      const currentFields = getFields()
      const sectionsField = currentFields.sections

      if (sectionsField?.rows && Array.isArray(sectionsField.rows)) {
        for (let i = sectionsField.rows.length - 1; i >= 0; i--) {
          removeFieldRow({
            path: "sections",
            rowIndex: i,
          })
        }
      }

      template.sections.forEach((section: any, index: number) => {
        const subFieldState: any = {}

        Object.entries(section).forEach(([key, value]) => {
          subFieldState[`sections.${index}.${key}`] = {
            value,
            valid: true,
          }
        })

        addFieldRow({
          path: "sections",
          schemaPath: "sections",
          rowIndex: index,
          blockType: section.blockType,
          subFieldState,
        })
      })

      setSelectedTemplate("")
    } catch (error) {
      console.error("Failed to apply template:", error)
      setSelectedTemplate("")
    } finally {
      setIsApplying(false)
    }
  }

  /*************************************************************************/
  /*  TEMPLATE OPTIONS PREPARATION
  /*************************************************************************/

  const templates = templatesResponse?.docs || []
  const templateOptions = templates.map((template: Template) => ({
    label: template.name,
    value: template.id,
  }))

  if (isLoading || templates.length === 0) {
    return null
  }

  return (
    <div className="template-control-ui-field">
      <div className="label-wrapper">
        <label className="field-label" htmlFor="templateSelector">
          Apply Template
        </label>
      </div>

      <div className="template-control-row">
        <div className="template-select">
          <SelectInput
            path="templateSelector"
            name="templateSelector"
            options={templateOptions}
            value={selectedTemplate}
            onChange={(option: any) => setSelectedTemplate(option?.value || "")}
            placeholder="Choose template..."
          />
        </div>

        <div className="apply-button">
          <Button
            buttonStyle="primary"
            size="large"
            icon="plus"
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate || isApplying}
          />
        </div>
      </div>
    </div>
  )
}
