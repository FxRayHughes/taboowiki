import { forwardRef, useCallback, useState } from "react"

// --- Icons ---
import { ChevronDownIcon } from "@site/src/components/tiptap-icons/chevron-down-icon"

// --- Hooks ---
import { useTiptapEditor } from "@site/src/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import { HeadingButton } from "@site/src/components/tiptap-ui/heading-button"
import { useHeadingDropdownMenu } from "@site/src/components/tiptap-ui/heading-dropdown-menu"

import { Button, ButtonGroup } from "@site/src/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@site/src/components/tiptap-ui-primitive/dropdown-menu"
import { Card, CardBody } from "@site/src/components/tiptap-ui-primitive/card"

/**
 * Dropdown menu component for selecting heading levels in a Tiptap editor.
 *
 * For custom dropdown implementations, use the `useHeadingDropdownMenu` hook instead.
 */
export const HeadingDropdownMenu = forwardRef((
  {
    editor: providedEditor,
    levels = [1, 2, 3, 4, 5, 6],
    hideWhenUnavailable = false,
    portal = false,
    onOpenChange,
    ...buttonProps
  },
  ref
) => {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = useState(false)
  const { isVisible, isActive, canToggle, Icon } = useHeadingDropdownMenu({
    editor,
    levels,
    hideWhenUnavailable,
  })

  const handleOpenChange = useCallback((open) => {
    if (!editor || !canToggle) return
    setIsOpen(open)
    onOpenChange?.(open)
  }, [canToggle, editor, onOpenChange])

  if (!isVisible) {
    return null
  }

  return (
    <DropdownMenu modal open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          data-active-state={isActive ? "on" : "off"}
          role="button"
          tabIndex={-1}
          disabled={!canToggle}
          data-disabled={!canToggle}
          aria-label="Format text as heading"
          aria-pressed={isActive}
          tooltip="Heading"
          {...buttonProps}
          ref={ref}>
          <Icon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" portal={portal}>
        <Card>
          <CardBody>
            <ButtonGroup>
              {levels.map((level) => (
                <DropdownMenuItem key={`heading-${level}`} asChild>
                  <HeadingButton
                    editor={editor}
                    level={level}
                    text={`标题 ${level}`}
                    showTooltip={false} />
                </DropdownMenuItem>
              ))}
            </ButtonGroup>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
})

HeadingDropdownMenu.displayName = "HeadingDropdownMenu"

export default HeadingDropdownMenu
