"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShuffleIcon } from "lucide-react"
import { nanoid } from "nanoid"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ChatAvatar } from "@/components/chat-avatar"
import { createBot } from "@/actions/bot"
import { createBotInputSchema, type CreateBotInput } from "@/lib/db/schema"

const BOT_PRESETS = [
  {
    label: "Research assistant",
    name: "Ada",
    job: "Research assistant",
    instructions: "Answer briefly, cite sources, and ask before running anything destructive.",
  },
  {
    label: "Code reviewer",
    name: "Linus",
    job: "Code reviewer",
    instructions: "Review diffs for logic bugs, performance bottlenecks, and security vulnerabilities.",
  },
  {
    label: "Writing editor",
    name: "Hemingway",
    job: "Writing editor",
    instructions: "Proofread drafts, improve clarity and flow, and suggest concise punchy phrasing.",
  },
  {
    label: "Tutor",
    name: "Socrates",
    job: "Tutor",
    instructions: "Guide understanding step-by-step with intuitive analogies and probing questions.",
  },
] as const

export interface BotDialogProps {
  /** Optional controlled open state */
  open?: boolean
  /** Optional controlled open state change handler */
  onOpenChange?: (open: boolean) => void
  /** Optional custom trigger element */
  trigger?: React.ReactElement
  /** Optional children used as trigger */
  children?: React.ReactElement
  /** Callback fired after successful bot creation */
  onSuccess?: () => void
}

export function BotDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  children,
  onSuccess,
}: BotDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value)
      }
      setControlledOpen?.(value)
    },
    [isControlled, setControlledOpen]
  )

  const [avatarSeed, setAvatarSeed] = React.useState(() => nanoid())

  const [activePreset, setActivePreset] = React.useState<string | null>(BOT_PRESETS[0].label)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBotInput>({
    resolver: zodResolver(createBotInputSchema),
    defaultValues: {
      name: BOT_PRESETS[0].name,
      job: BOT_PRESETS[0].job,
      instructions: BOT_PRESETS[0].instructions,
      avatar: avatarSeed,
    },
  })

  // Keep form avatar value in sync with state
  React.useEffect(() => {
    setValue("avatar", avatarSeed, { shouldValidate: true })
  }, [avatarSeed, setValue])

  const handleShuffleAvatar = React.useCallback(() => {
    const nextSeed = nanoid()
    setAvatarSeed(nextSeed)
    setValue("avatar", nextSeed, { shouldValidate: true })
  }, [setValue])

  const handleApplyPreset = React.useCallback(
    (preset: (typeof BOT_PRESETS)[number]) => {
      setActivePreset(preset.label)
      setValue("name", preset.name, { shouldValidate: true })
      setValue("job", preset.job, { shouldValidate: true })
      setValue("instructions", preset.instructions, { shouldValidate: true })
    },
    [setValue]
  )

  const onSubmit = async (values: CreateBotInput) => {
    try {
      const result = await createBot(values)
      if (result.success) {
        toast.add({
          title: "Bot created",
          description: `${result.bot.name} is ready to chat.`,
        })
        reset({
          name: "",
          job: "",
          instructions: "",
          avatar: nanoid(),
        })
        setAvatarSeed(nanoid())
        setOpen(false)
        onSuccess?.()
      }
    } catch (error) {
      toast.add({
        type: "error",
        title: "Failed to create bot",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      })
    }
  }

  const triggerNode = trigger ?? children

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerNode && <DialogTrigger render={triggerNode} />}
      <DialogContent className="w-[calc(100%-2rem)] max-w-[460px] sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>New bot</DialogTitle>
          <DialogDescription>Give it a face, a name, and a job to do.</DialogDescription>
        </DialogHeader>

        {/* Preset chips */}
        <div className="flex flex-wrap items-center gap-2">
          {BOT_PRESETS.map((preset) => {
            const isActive = activePreset === preset.label
            return (
              <Button
                key={preset.label}
                type="button"
                variant={isActive ? "secondary" : "outline"}
                size="sm"
                className="h-8 rounded-full text-xs font-normal"
                onClick={() => handleApplyPreset(preset)}
              >
                {preset.label}
              </Button>
            )
          })}
        </div>

        {/* Face section */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-border shadow-xs">
              <ChatAvatar seed={avatarSeed} className="size-9" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none">Face</span>
              <span className="text-xs text-muted-foreground">Shuffle until you find one you like.</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShuffleAvatar}
            className="h-8 gap-1.5 text-xs"
          >
            <ShuffleIcon data-icon="inline-start" className="size-3.5" />
            Shuffle
          </Button>
        </div>

        {/* Form fields */}
        <form id="create-bot-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="bot-name">Name</FieldLabel>
              <Input
                id="bot-name"
                placeholder="Ada"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.job}>
              <FieldLabel htmlFor="bot-job">Job</FieldLabel>
              <Input
                id="bot-job"
                placeholder="Research assistant"
                aria-invalid={!!errors.job}
                {...register("job")}
              />
              <FieldError errors={[errors.job]} />
            </Field>

            <Field data-invalid={!!errors.instructions}>
              <FieldLabel htmlFor="bot-instructions">How it should work</FieldLabel>
              <Textarea
                id="bot-instructions"
                rows={4}
                className="resize-none"
                placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                aria-invalid={!!errors.instructions}
                {...register("instructions")}
              />
              <FieldError errors={[errors.instructions]} />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="create-bot-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Creating...
              </>
            ) : (
              "Create bot"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BotDialog
