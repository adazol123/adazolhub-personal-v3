import { cva, type VariantProps } from "class-variance-authority";

export const typographyVariants = cva(
    "",
    {
        variants: {
            variant: {
                heading1: "text-4xl font-bold",
                heading2: "text-2xl font-medium",
                heading3: "text-xl font-medium",
                heading4: "text-lg font-medium",
                heading5: "text-sm font-bold",
                heading6: "text-xs font-bold",
                caption: "text-sm font-medium",
                captionUpperCase: "uppercase text-sm", 
                tag: "text-xs",

                base: "text-base",
                body: "text-base",
                body2: "text-sm",
                default: "text-base"
            },
        },
        defaultVariants: {
            variant: "default"
        }
    }
)

export type TypographyVariants = VariantProps<typeof typographyVariants>