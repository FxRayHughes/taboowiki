import { TokenManager } from '@site/src/components/AuthGuard/TokenManager'
import { buildApiUrl } from '@site/src/utils/api'

/**
 * 上传单张图片到服务器
 *
 * @param {File} file - 要上传的图片文件
 * @param {Function} onProgress - 进度回调函数，接收 { progress: number } 对象
 * @param {AbortSignal} abortSignal - 用于取消上传的信号
 * @returns {Promise<string>} - 返回上传后的图片 URL
 */
export const uploadImage = async (file, onProgress, abortSignal) => {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  // 验证文件大小
  if (file.size > MAX_SIZE) {
    throw new Error('文件大小不能超过 5MB')
  }

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('仅支持 JPG、PNG、GIF、WebP 格式的图片')
  }

  const formData = new FormData()
  formData.append('file', file)

  const xhr = new XMLHttpRequest()

  // 监听上传进度
  xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) {
      const progress = Math.round((event.loaded / event.total) * 100)
      onProgress?.({ progress })
    }
  })

  // 处理取消上传
  abortSignal?.addEventListener('abort', () => {
    xhr.abort()
  })

  return new Promise((resolve, reject) => {
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          if (data.success && data.data?.url) {
            resolve(data.data.url)  // 返回图片 URL
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch (e) {
          reject(new Error('解析服务器响应失败'))
        }
      } else if (xhr.status === 400) {
        // 验证错误
        try {
          const data = JSON.parse(xhr.responseText)
          reject(new Error(data.message || '图片验证失败'))
        } catch (e) {
          reject(new Error('图片验证失败'))
        }
      } else if (xhr.status === 401) {
        reject(new Error('请先登录'))
      } else {
        reject(new Error(`上传失败: ${xhr.statusText}`))
      }
    }

    xhr.onerror = () => reject(new Error('网络错误，请检查网络连接'))
    xhr.onabort = () => reject(new Error('上传已取消'))

    // 使用 buildApiUrl 构建完整 URL
    const apiUrl = buildApiUrl('/api/upload/image')

    xhr.open('POST', apiUrl)

    // 添加认证 Token
    const token = TokenManager.getToken()
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    } else {
      reject(new Error('未登录，请先登录后再上传图片'))
      return
    }

    xhr.send(formData)
  })
}

/**
 * 批量上传图片
 *
 * @param {File[]} files - 要上传的图片文件数组
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<string[]>} - 返回上传后的图片 URL 数组
 */
export const uploadImages = async (files, onProgress) => {
  if (!files || files.length === 0) {
    throw new Error('没有选择文件')
  }

  if (files.length > 10) {
    throw new Error('一次最多上传 10 张图片')
  }

  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  const xhr = new XMLHttpRequest()

  // 监听上传进度
  xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) {
      const progress = Math.round((event.loaded / event.total) * 100)
      onProgress?.({ progress })
    }
  })

  return new Promise((resolve, reject) => {
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          if (data.success && Array.isArray(data.data)) {
            const urls = data.data.map(item => item.url)
            resolve(urls)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch (e) {
          reject(new Error('解析服务器响应失败'))
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText)
          reject(new Error(data.message || '上传失败'))
        } catch (e) {
          reject(new Error(`上传失败: ${xhr.statusText}`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('网络错误'))
    xhr.onabort = () => reject(new Error('上传已取消'))

    // 使用 buildApiUrl 构建完整 URL
    const apiUrl = buildApiUrl('/api/upload/images')

    xhr.open('POST', apiUrl)

    const token = TokenManager.getToken()
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    } else {
      reject(new Error('未登录，请先登录后再上传图片'))
      return
    }

    xhr.send(formData)
  })
}
