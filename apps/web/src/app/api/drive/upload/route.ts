export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/auth'
import {
  getDriveClient,
  getOrCreateContractFolder,
  uploadFileToDrive,
  refreshAccessToken,
} from '@/lib/google-drive'
import { decrypt } from '@/lib/encrypt'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    let accessToken = session.accessToken as string | undefined

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token in session' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file in form data' }, { status: 400 })
    }

    const fileName = name ?? file.name
    const mimeType = file.type || 'application/octet-stream'

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Attempt to get drive client; refresh token if needed
    let drive = getDriveClient(accessToken)

    try {
      // Probe the Drive API — if token expired this will throw
      await drive.about.get({ fields: 'user' })
    } catch {
      // Token likely expired — fetch encrypted refresh token from Supabase and refresh
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
      const { data: tokenRow, error: fetchError } = await supabase
        .from('user_tokens')
        .select('refresh_token')
        .eq('user_id', userId)
        .single()

      if (fetchError || !tokenRow?.refresh_token) {
        return NextResponse.json(
          { error: 'Could not retrieve refresh token. Please sign in again.' },
          { status: 401 }
        )
      }

      const decryptedRefreshToken = decrypt(tokenRow.refresh_token as string)
      accessToken = await refreshAccessToken(decryptedRefreshToken)
      drive = getDriveClient(accessToken)
    }

    // Get or create ContractOS folder in user's Drive
    const folderId = await getOrCreateContractFolder(drive, userId)

    // Upload the file
    const { id: driveFileId, webViewLink } = await uploadFileToDrive(
      drive,
      fileBuffer,
      fileName,
      mimeType,
      folderId
    )

    return NextResponse.json({ driveFileId, webViewLink, fileName })
  } catch (err) {
    console.error('Unexpected error in POST /api/drive/upload:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
