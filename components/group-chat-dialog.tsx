"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { ChatAvatar } from "@/components/chat-avatar"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Trash2Icon } from "lucide-react"
import { createGroupChat, updateGroupChat, deleteGroupChat, getAvailableBots } from "@/actions/group-chat"
import type { Bot } from "@/lib/db/schema"

export interface GroupChatDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  initialGroup?: {
    id: string
    name: string
    bots: Array<{ id: string; name?: string; avatar?: string; job?: string | null }>
  }
  bots?: Bot[]
}

export function GroupChatDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  initialGroup,
  bots = [],
}: GroupChatDialogProps) {
  const router = useRouter()
  const isEditing = Boolean(initialGroup)

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen

  const [name, setName] = React.useState(initialGroup?.name ?? "")
  const [selectedBotIds, setSelectedBotIds] = React.useState<string[]>(
    initialGroup?.bots.map((b) => b.id) ?? []
  )
  const [fetchedBots, setFetchedBots] = React.useState<Bot[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  // Fetch all user bots if none were passed as props
  React.useEffect(() => {
    if (open && bots.length === 0 && fetchedBots.length === 0) {
      getAvailableBots()
        .then((data) => {
          if (Array.isArray(data)) setFetchedBots(data as Bot[])
        })
        .catch(console.error)
    }
  }, [open, bots.length, fetchedBots.length])

  // Combined list of bots available to add/remove
  const availableBots = React.useMemo(() => {
    if (bots.length > 0) return bots
    if (fetchedBots.length > 0) return fetchedBots
    if (initialGroup?.bots) {
      return initialGroup.bots as Bot[]
    }
    return []
  }, [bots, fetchedBots, initialGroup])

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(initialGroup?.name ?? "")
      setSelectedBotIds(initialGroup?.bots.map((b) => b.id) ?? [])
    }
    setOpen(newOpen)
  }

  const toggleBot = (botId: string) => {
    setSelectedBotIds((prev) =>
      prev.includes(botId) ? prev.filter((id) => id !== botId) : [...prev, botId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selectedBotIds.length === 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      if (isEditing && initialGroup) {
        const res = await updateGroupChat({
          id: initialGroup.id,
          name: name.trim(),
          botIds: selectedBotIds,
        })
        if (res.success) {
          toast.add({
            title: "Group updated",
            description: `Saved changes to "${name.trim()}".`,
          })
          setOpen(false)
        }
      } else {
        const res = await createGroupChat({
          name: name.trim(),
          botIds: selectedBotIds,
        })

        if (res.success && res.groupChat) {
          toast.add({
            title: "Group chat created",
            description: `Created "${name.trim()}" with ${selectedBotIds.length} bots.`,
          })
          setOpen(false)
          router.push(`/chats/${res.groupChat.id}`)
        } else {
          toast.add({
            title: "Failed to create group chat",
            description: "Could not create group chat. Please try again.",
          })
        }
      }
    } catch (err) {
      console.error(err)
      toast.add({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!initialGroup || isDeleting) return
    setIsDeleting(true)
    try {
      const res = await deleteGroupChat(initialGroup.id)
      if (res.success) {
        toast.add({
          title: "Group deleted",
          description: `Group "${initialGroup.name}" has been deleted.`,
        })
        setIsDeleteDialogOpen(false)
        setOpen(false)
        router.push("/")
      }
    } catch (err) {
      console.error(err)
      toast.add({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete group",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
        <DialogContent className="w-[calc(100%-2rem)] max-w-[460px] sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit group chat" : "New group chat"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the group name and choose member bots."
                : "Name the group and pick which bots are in it."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="group-name" className="text-sm font-medium">
                Name
              </FieldLabel>
              <Input
                id="group-name"
                placeholder="Weekend plans"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 px-3 bg-muted/40"
                autoFocus
              />
            </Field>

            <Field className="gap-1.5">
              <FieldLabel className="text-sm font-medium">Bots</FieldLabel>
              {availableBots.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No bots found.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-border/70 p-1.5 bg-muted/20">
                  {availableBots.map((bot) => {
                    const isChecked = selectedBotIds.includes(bot.id)
                    return (
                      <label
                        key={bot.id}
                        className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer select-none transition-colors"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleBot(bot.id)}
                        />
                        <ChatAvatar seed={bot.avatar} className="size-6 rounded-md" />
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {bot.name}
                          </span>
                          {bot.job && (
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {bot.job}
                            </span>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </Field>

            <DialogFooter className="pt-2 flex items-center justify-between gap-2">
              {isEditing ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isSubmitting || isDeleting}
                  className="cursor-pointer gap-1.5"
                >
                  <Trash2Icon className="size-4" />
                  Delete group
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
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || selectedBotIds.length === 0 || isSubmitting || isDeleting}
                  className="cursor-pointer"
                >
                  {isSubmitting && <Spinner className="size-4 mr-1.5" />}
                  {isEditing ? "Save changes" : "Create group"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Alert Dialog */}
      {isEditing && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[420px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete group chat?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete &quot;{initialGroup?.name}&quot; and remove all message history for this group chat.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Spinner className="size-4 mr-1.5" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export default GroupChatDialog
