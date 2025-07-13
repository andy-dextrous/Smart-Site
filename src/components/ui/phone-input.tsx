import * as React from "react"
import { CheckIcon, ChevronsUpDown, Search } from "lucide-react"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/utilities/ui"

type PhoneInputProps = Omit<React.ComponentProps<"input">, "onChange" | "value" | "ref"> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void
  }

/*************************************************************************/
/*  MAIN PHONE INPUT COMPONENT
/*************************************************************************/

function PhoneInput({ className, onChange, value, ...props }: PhoneInputProps) {
  return (
    <RPNInput.default
      className={cn("flex", className)}
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      inputComponent={InputComponent}
      smartCaret={false}
      value={value || undefined}
      /**
       * Handles the onChange event.
       *
       * react-phone-number-input might trigger the onChange event as undefined
       * when a valid phone number is not entered. To prevent this,
       * the value is coerced to an empty string.
       *
       * @param {E164Number | undefined} value - The entered value
       */
      onChange={value => onChange?.(value || ("" as RPNInput.Value))}
      {...props}
    />
  )
}
PhoneInput.displayName = "PhoneInput"

/*************************************************************************/
/*  INPUT COMPONENT
/*************************************************************************/

function InputComponent({ className, ...props }: React.ComponentProps<"input">) {
  return <Input className={cn("rounded-s-none", className)} {...props} />
}
InputComponent.displayName = "InputComponent"

/*************************************************************************/
/*  TYPES AND INTERFACES
/*************************************************************************/

type CountryEntry = { label: string; value: RPNInput.Country | undefined }

type CountrySelectProps = {
  disabled?: boolean
  value: RPNInput.Country
  options: CountryEntry[]
  onChange: (country: RPNInput.Country) => void
}

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country
  onChange: (country: RPNInput.Country) => void
  onSelectComplete: () => void
  isHighlighted?: boolean
}

/*************************************************************************/
/*  CUSTOM COUNTRY SELECT DROPDOWN
/*************************************************************************/

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  const [searchValue, setSearchValue] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)

  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  // Filter countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!searchValue) return countryList
    return countryList.filter(({ label }) =>
      label.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [countryList, searchValue])

  /*************************************************************************/
  /*  EVENT HANDLERS
  /*************************************************************************/

  function handleToggle() {
    if (disabled) return
    setIsOpen(!isOpen)
    setSearchValue("")
    setHighlightedIndex(-1)
  }

  function handleClose() {
    setIsOpen(false)
    setSearchValue("")
    setHighlightedIndex(-1)
  }

  function handleCountrySelect(country: RPNInput.Country) {
    onChange(country)
    handleClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
      return
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault()
        handleClose()
        buttonRef.current?.focus()
        break
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredCountries[highlightedIndex]?.value) {
          handleCountrySelect(filteredCountries[highlightedIndex].value!)
        }
        break
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(0)
        break
      case "Escape":
        e.preventDefault()
        handleClose()
        buttonRef.current?.focus()
        break
    }
  }

  /*************************************************************************/
  /*  EFFECTS
  /*************************************************************************/

  // Handle outside clicks
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Prevent ScrollSmoother from interfering with dropdown scrolling
  React.useEffect(() => {
    function handleWheel(e: WheelEvent) {
      // Stop the event from bubbling up to ScrollSmoother
      e.stopPropagation()
    }

    if (isOpen && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      scrollArea.addEventListener("wheel", handleWheel, { passive: false })
      return () => scrollArea.removeEventListener("wheel", handleWheel)
    }
  }, [isOpen])

  // Focus search input when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current && filteredCountries.length > 0) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [highlightedIndex, filteredCountries])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        ref={buttonRef}
        type="button"
        variant="phoneSelect"
        size="phoneSelect"
        className="border-r-0 focus:z-10"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <FlagComponent country={selectedCountry} countryName={selectedCountry} />
        <ChevronsUpDown
          className={cn("-mr-2 size-4 opacity-50", disabled ? "hidden" : "opacity-100")}
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[300px] rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950">
          {/* Search Input */}
          <div className="border-b border-gray-200 p-2 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 transform text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={e => {
                  setSearchValue(e.target.value)
                  setHighlightedIndex(-1)
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search country..."
                className="w-full rounded border border-gray-200 bg-transparent py-1.5 pr-2 pl-8 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700"
              />
            </div>
          </div>

          {/* Country List */}
          <ScrollArea className="h-72" ref={scrollAreaRef}>
            <div ref={listRef}>
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No country found.
                </div>
              ) : (
                filteredCountries.map(({ value, label }, index) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={handleCountrySelect}
                      onSelectComplete={handleClose}
                      isHighlighted={index === highlightedIndex}
                    />
                  ) : null
                )
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

/*************************************************************************/
/*  COUNTRY SELECT OPTION
/*************************************************************************/

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
  isHighlighted = false,
}: CountrySelectOptionProps) => {
  function handleSelect() {
    onChange(country)
    onSelectComplete()
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800",
        isHighlighted && "bg-gray-100 dark:bg-gray-800",
        country === selectedCountry && "bg-blue-50 dark:bg-blue-950"
      )}
      onClick={handleSelect}
    >
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-gray-500">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
      <CheckIcon
        className={cn(
          "ml-auto size-4",
          country === selectedCountry ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}

/*************************************************************************/
/*  FLAG COMPONENT
/*************************************************************************/

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country] as any

  return (
    <span className="bg-foreground/20 flex h-4 w-6 overflow-hidden rounded-sm [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  )
}

export { PhoneInput }
