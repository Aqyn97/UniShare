import { apiClient } from './client'

interface CloudinarySignatureResponse {
  signature: string
  apiKey: string
  cloudName: string
  params: Record<string, unknown>
}

export async function uploadImageToCloudinary(
  file: File,
): Promise<{ publicId: string; url: string }> {
  const timestamp = Math.round(Date.now() / 1000)

  const { data } = await apiClient.post<CloudinarySignatureResponse>(
    '/uploads/cloudinary/signature',
    { params: { timestamp } },
  )

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', data.apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', data.signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
    { method: 'POST', body: formData },
  )

  if (!res.ok) throw new Error('Image upload failed. Please try again.')

  const json = await res.json()
  return { publicId: json.public_id as string, url: json.secure_url as string }
}
