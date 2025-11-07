"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "@site/src/components/tiptap-ui-primitive/button"
import { Spacer } from "@site/src/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@site/src/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@site/src/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@site/src/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { PasteImageUpload } from "@site/src/components/tiptap-node/paste-image-upload/paste-image-upload-extension"
import "@site/src/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@site/src/components/tiptap-node/code-block-node/code-block-node.scss"
import "@site/src/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@site/src/components/tiptap-node/list-node/list-node.scss"
import "@site/src/components/tiptap-node/image-node/image-node.scss"
import "@site/src/components/tiptap-node/heading-node/heading-node.scss"
import "@site/src/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@site/src/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@site/src/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@site/src/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@site/src/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@site/src/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@site/src/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@site/src/components/tiptap-ui/link-popover"
import { MarkButton } from "@site/src/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@site/src/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@site/src/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@site/src/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@site/src/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@site/src/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsMobile } from "@site/src/hooks/use-mobile"
import { useWindowSize } from "@site/src/hooks/use-window-size"
import { useCursorVisibility } from "@site/src/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@site/src/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { MAX_FILE_SIZE } from "@site/src/lib/tiptap-utils"
import { uploadImage } from "@site/src/utils/upload"

// --- Styles ---
import "@site/src/components/tiptap-templates/simple/simple-editor.scss"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile
}) => {
  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} portal={isMobile} />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ImageUploadButton text="上传" />
      </ToolbarGroup>
      <Spacer />
      {isMobile && <ToolbarSeparator />}
    </>
  );
}

const MobileToolbarContent = ({
  type,
  onBack
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({ value, onChange, placeholder }) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState("main")
  const toolbarRef = useRef(null)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": placeholder || "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      PasteImageUpload.configure({
        upload: uploadImage,
      }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: uploadImage,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML())
      }
    },
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  // Sync editor content when value prop changes
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentContent = editor.getHTML()
      if (currentContent !== value) {
        editor.commands.setContent(value || '')
      }
    }
  }, [editor, value])

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}>
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile} />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")} />
          )}
        </Toolbar>

        <EditorContent editor={editor} role="presentation" className="simple-editor-content" />
      </EditorContext.Provider>
    </div>
  );
}
