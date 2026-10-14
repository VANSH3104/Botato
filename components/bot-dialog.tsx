"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShuffleIcon, Trash2Icon } from "lucide-react"
import { nanoid } from "nanoid"
import { useRouter, usePathname } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ChatAvatar } from "@/components/chat-avatar"
import { createBot, updateBot, deleteBot } from "@/actions/bot"
import { createBotInputSchema, type CreateBotInput, type Bot } from "@/lib/db/schema"

const BOT_PRESETS = [
  {
    label: "General assistant",
    name: "Botato",
    job: "Helpful AI assistant",
    instructions: "Be helpful, friendly, concise, and direct in your responses.",
  },
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
  /** Optional bot to edit (populates the form with existing data) */
  initialBot?: Bot
  /** Callback fired after successful bot creation or update */
  onSuccess?: () => void
  /** Optional callback fired after successful bot deletion */
  onDelete?: () => void
}

export function BotDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  children,
  initialBot,
  onSuccess,
  onDelete,
}: BotDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const isEditing = !!initialBot
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBotInput>({
    resolver: zodResolver(createBotInputSchema),
    defaultValues: initialBot
      ? {
          name: initialBot.name,
          job: initialBot.job ?? "",
          instructions: initialBot.instructions ?? "",
          avatar: initialBot.avatar,
        }
      : {
          name: BOT_PRESETS[0].name,
          job: BOT_PRESETS[0].job,
          instructions: BOT_PRESETS[0].instructions,
          avatar: nanoid(),
        },
  })

  const avatar = useWatch({ control, name: "avatar" })
  const watchName = useWatch({ control, name: "name" })
  const watchJob = useWatch({ control, name: "job" })

  const activePreset = React.useMemo(() => {
    return BOT_PRESETS.find((p) => p.name === watchName && p.job === watchJob)?.label ?? null
  }, [watchName, watchJob])

  // Reset form when dialog opens or initialBot changes
  React.useEffect(() => {
    if (open) {
      if (initialBot) {
        reset({
          name: initialBot.name,
          job: initialBot.job ?? "",
          instructions: initialBot.instructions ?? "",
          avatar: initialBot.avatar,
        })
      } else {
        const defaultPreset = BOT_PRESETS[0]
        reset({
          name: defaultPreset.name,
          job: defaultPreset.job,
          instructions: defaultPreset.instructions,
          avatar: nanoid(),
        })
      }
    }
  }, [open, initialBot, reset])

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setInternalOpen(value)
      }
      setControlledOpen?.(value)
    },
    [isControlled, setControlledOpen]
  )

  const handleShuffleAvatar = React.useCallback(() => {
    setValue("avatar", nanoid(), { shouldValidate: true })
  }, [setValue])

  const handleApplyPreset = React.useCallback(
    (preset: (typeof BOT_PRESETS)[number]) => {
      setValue("name", preset.name, { shouldValidate: true })
      setValue("job", preset.job, { shouldValidate: true })
      setValue("instructions", preset.instructions, { shouldValidate: true })
    },
    [setValue]
  )

  const onSubmit = async (values: CreateBotInput) => {
    try {
      if (isEditing && initialBot) {
        const result = await updateBot({ ...values, id: initialBot.id })
        if (result.success) {
          toast.add({
            title: "Bot updated",
            description: `${result.bot.name} has been updated.`,
          })
          setOpen(false)
          router.refresh()
          onSuccess?.()
        }
      } else {
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
          setOpen(false)
          router.refresh()
          onSuccess?.()
        }
      }
    } catch (error) {
      toast.add({
        type: "error",
        title: isEditing ? "Failed to update bot" : "Failed to create bot",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!initialBot) return

    try {
      setIsDeleting(true)
      const result = await deleteBot(initialBot.id)
      if (result.success) {
        toast.add({
          title: "Bot deleted",
          description: `${initialBot.name} has been deleted.`,
        })
        setConfirmDeleteOpen(false)
        setOpen(false)
        onDelete?.()
        onSuccess?.()
        router.refresh()
        if (
          pathname === `/chats/${initialBot.id}` ||
          pathname.startsWith(`/chats/${initialBot.id}/`)
        ) {
          router.push("/")
        }
      }
    } catch (error) {
      toast.add({
        type: "error",
        title: "Failed to delete bot",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const triggerNode = trigger ?? children

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {triggerNode && <DialogTrigger render={triggerNode} />}
        <DialogContent className="w-[calc(100%-2rem)] max-w-[460px] sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit bot" : "New bot"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the bot's face, name, and job."
                : "Give it a face, a name, and a job to do."}
            </DialogDescription>
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
                <ChatAvatar seed={avatar || "bot"} className="size-9" />
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
                  placeholder="Botato"
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

          {/* Dialog Footer */}
          <DialogFooter className="mt-2 flex-row items-center justify-between sm:justify-between">
            {isEditing ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isSubmitting || isDeleting}
              >
                <Trash2Icon data-icon="inline-start" className="size-4" />
                Delete bot
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-bot-form"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    {isEditing ? "Saving..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Save changes"
                ) : (
                  "Create bot"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      {isEditing && initialBot && (
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {initialBot.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This bot will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Deleting...
                  </>
                ) : (
                  "Delete bot"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export default BotDialog
