import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { uploadImage } from '@site/src/utils/upload'

/**
 * 粘贴图片自动上传扩展
 * 当用户粘贴或拖拽图片时，自动上传到服务器并插入 URL
 */
export const PasteImageUpload = Extension.create({
  name: 'pasteImageUpload',

  addOptions() {
    return {
      upload: uploadImage,
    }
  },

  addProseMirrorPlugins() {
    const upload = this.options.upload

    return [
      new Plugin({
        key: new PluginKey('pasteImageUpload'),
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || [])
            const imageItems = items.filter((item) => item.type.indexOf('image') === 0)

            if (imageItems.length === 0) {
              return false
            }

            // 阻止默认粘贴行为
            event.preventDefault()

            // 处理每个粘贴的图片
            imageItems.forEach(async (item) => {
              const file = item.getAsFile()
              if (!file) return

              try {
                // 在光标位置插入加载占位符
                const { state } = view
                const { from } = state.selection

                const placeholderText = '⏳ 正在上传图片...'
                const tr = state.tr.insertText(placeholderText, from)
                view.dispatch(tr)

                // 上传图片
                const url = await upload(
                  file,
                  (progress) => {
                    console.log('Upload progress:', progress.progress + '%')
                  },
                  null
                )

                // 上传成功后，替换占位符为图片
                const currentState = view.state
                let found = false
                let foundPos = -1

                // 查找占位符
                currentState.doc.descendants((node, pos) => {
                  if (node.isText && node.text?.includes(placeholderText)) {
                    found = true
                    foundPos = pos
                    return false
                  }
                })

                if (found && foundPos >= 0) {
                  const deleteTr = currentState.tr.delete(
                    foundPos,
                    foundPos + placeholderText.length
                  )

                  // 插入图片节点
                  const imageNode = currentState.schema.nodes.image.create({ src: url })
                  deleteTr.insert(foundPos, imageNode)

                  view.dispatch(deleteTr)
                }
              } catch (error) {
                console.error('Upload failed:', error)

                // 替换占位符为错误信息
                const currentState = view.state
                const errorText = `❌ 上传失败: ${error.message}`

                let foundPos = -1
                currentState.doc.descendants((node, pos) => {
                  if (node.isText && node.text?.includes('⏳ 正在上传图片...')) {
                    foundPos = pos
                    return false
                  }
                })

                if (foundPos >= 0) {
                  const tr = currentState.tr.delete(
                    foundPos,
                    foundPos + '⏳ 正在上传图片...'.length
                  )
                  tr.insertText(errorText, foundPos)
                  view.dispatch(tr)
                }
              }
            })

            return true
          },

          handleDrop(view, event) {
            const files = Array.from(event.dataTransfer?.files || [])
            const imageFiles = files.filter((file) => file.type.indexOf('image') === 0)

            if (imageFiles.length === 0) {
              return false
            }

            // 阻止默认拖拽行为
            event.preventDefault()

            // 获取拖拽位置
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })

            if (!coordinates) return true

            const dropPos = coordinates.pos

            // 处理每个拖拽的图片
            imageFiles.forEach(async (file) => {
              try {
                // 在拖拽位置插入占位符
                const { state } = view
                const placeholderText = '⏳ 正在上传图片...'
                const tr = state.tr.insertText(placeholderText, dropPos)
                view.dispatch(tr)

                // 上传图片
                const url = await upload(
                  file,
                  (progress) => {
                    console.log('Upload progress:', progress.progress + '%')
                  },
                  null
                )

                // 上传成功后，替换占位符为图片
                const currentState = view.state
                let foundPos = -1

                currentState.doc.descendants((node, pos) => {
                  if (node.isText && node.text?.includes(placeholderText)) {
                    foundPos = pos
                    return false
                  }
                })

                if (foundPos >= 0) {
                  const deleteTr = currentState.tr.delete(
                    foundPos,
                    foundPos + placeholderText.length
                  )

                  const imageNode = currentState.schema.nodes.image.create({ src: url })
                  deleteTr.insert(foundPos, imageNode)

                  view.dispatch(deleteTr)
                }
              } catch (error) {
                console.error('Upload failed:', error)

                // 显示错误信息
                const currentState = view.state
                const errorText = `❌ 上传失败: ${error.message}`

                let foundPos = -1
                currentState.doc.descendants((node, pos) => {
                  if (node.isText && node.text?.includes('⏳ 正在上传图片...')) {
                    foundPos = pos
                    return false
                  }
                })

                if (foundPos >= 0) {
                  const tr = currentState.tr.delete(
                    foundPos,
                    foundPos + '⏳ 正在上传图片...'.length
                  )
                  tr.insertText(errorText, foundPos)
                  view.dispatch(tr)
                }
              }
            })

            return true
          },
        },
      }),
    ]
  },
})
