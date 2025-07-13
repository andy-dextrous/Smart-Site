"use client"

import ArrowRightIcon from "@/components/icons/arrow-right"
import Quotation from "@/components/icons/quotation"
import { SectionIntro } from "@/components/layout/section-intro"
import { Button } from "@/components/ui/button"
import { Media } from "@/payload/components/frontend/media"
import type { TestimonialsBlock } from "@/payload/payload-types"
import { Autoplay, Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/autoplay"
import "swiper/css/navigation"

export const TestimonialsComponent: React.FC<TestimonialsBlock> = props => {
  const { heading, description, testimonials } = props

  return (
    <section className="bg-dark-50 side-border-dark">
      <SectionIntro heading={heading} description={description} align="start" />

      {/* Mobile Navigation - Left aligned, in normal flow */}
      <div className="flex justify-start px-4 py-4 md:hidden">
        <div className="flex items-center gap-2">
          <Button className="testimonials-previous hover:cursor-pointer" icon={true}>
            <ArrowRightIcon className="!h-4 !w-4 rotate-180" />
          </Button>
          <Button
            className="testimonials-next hover:cursor-pointer"
            variant="outlineDark"
            icon={true}
          >
            <ArrowRightIcon className="!h-4 !w-4" />
          </Button>
        </div>
      </div>

      <div className="border-dark-border relative w-full border-t">
        {/* Desktop Navigation - Absolute positioned */}
        <div className="absolute -top-16 right-0 hidden h-16 items-center justify-between md:flex">
          <div className="flex items-center">
            <Button className="testimonials-previous hover:cursor-pointer" icon={true}>
              <ArrowRightIcon className="!h-4 !w-4 rotate-180 md:!h-6 md:!w-6" />
            </Button>
            <Button
              className="testimonials-next hover:cursor-pointer"
              variant="outlineDark"
              icon={true}
            >
              <ArrowRightIcon className="!h-4 !w-4 md:!h-6 md:!w-6" />
            </Button>
          </div>
        </div>
        <TestimonialSlider testimonials={testimonials} />
      </div>
    </section>
  )
}

/*******************************************************/
/*  Testimonial Slider Component
/*******************************************************/

const TestimonialSlider = ({
  testimonials,
}: {
  testimonials: TestimonialsBlock["testimonials"]
}) => {
  if (!testimonials || testimonials.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        No testimonials selected
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <Swiper
        spaceBetween={0}
        slidesPerView={1.2}
        centeredSlides={false}
        autoplay={{
          delay: 5000,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          320: {
            slidesPerView: 1.1,
            spaceBetween: 0,
          },
          480: {
            slidesPerView: 1.3,
            spaceBetween: 0,
          },
          768: {
            slidesPerView: 1.8,
            spaceBetween: 0,
          },
          1024: {
            slidesPerView: 2.2,
            spaceBetween: 0,
          },
          1200: {
            slidesPerView: 2.5,
            spaceBetween: 0,
          },
        }}
        loop={true}
        modules={[Navigation, Autoplay]}
        navigation={{
          nextEl: ".testimonials-next",
          prevEl: ".testimonials-previous",
        }}
      >
        {testimonials.map((testimonial, index) => {
          // Handle both string IDs and populated testimonial objects
          const testimonialData = typeof testimonial === "string" ? null : testimonial

          if (!testimonialData) return null

          return (
            <SwiperSlide key={testimonialData.id || index}>
              <article className="border-dark-border flex min-h-[250px] flex-col justify-between border-r border-b p-4 md:min-h-[300px] md:p-6 lg:min-h-[350px] lg:p-8">
                <div className="mb-4 md:mb-6 lg:mb-8">
                  <Quotation className="text-primary mb-4 h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12" />
                  <blockquote className="text-base leading-relaxed font-light md:text-lg lg:text-xl">
                    {testimonialData.quote}
                  </blockquote>
                </div>

                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900 md:text-base">
                      {testimonialData.name}
                    </div>
                    <div className="text-primary truncate text-xs font-light md:text-sm">
                      {testimonialData.title}, {testimonialData.company}
                    </div>
                  </div>
                  <div className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 md:h-10 md:w-10 lg:h-12 lg:w-12">
                    {testimonialData.companyLogo && (
                      <Media
                        resource={testimonialData.companyLogo}
                        className="h-4 w-4 md:h-6 md:w-6 lg:h-8 lg:w-8"
                      />
                    )}
                  </div>
                </div>
              </article>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
