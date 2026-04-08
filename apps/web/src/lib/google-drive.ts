import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { Readable } from 'stream'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_KEY!

/**
 * Returns an authenticated Google Drive v3 client using the provided access token.
 */
export function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.drive({ version: 'v3', auth })
}

/**
 * Searches for a folder named "ContractOS" in the user's Drive.
 * Creates it if not found. Persists the folder_id to Supabase user_tokens.
 * Returns the folder ID.
 */
export async function getOrCreateContractFolder(
  drive: ReturnType<typeof getDriveClient>,
  userId: string
): Promise<string> {
  // Search for an existing ContractOS folder
  const searchRes = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and name='ContractOS' and trashed=false",
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  const files = searchRes.data.files ?? []

  let folderId: string

  if (files.length > 0 && files[0].id) {
    folderId = files[0].id
  } else {
    // Create the folder
    const createRes = await drive.files.create({
      requestBody: {
        name: 'ContractOS',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    })

    if (!createRes.data.id) {
      throw new Error('Failed to create ContractOS folder in Google Drive')
    }

    folderId = createRes.data.id
  }

  // Persist the folder_id to Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  await supabase
    .from('user_tokens')
    .update({ folder_id: folderId, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return folderId
}

/**
 * Uploads a file buffer to the specified Drive folder.
 * Returns the file ID and a web view link.
 */
export async function uploadFileToDrive(
  drive: ReturnType<typeof getDriveClient>,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const readable = Readable.from(fileBuffer)

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: readable,
    },
    fields: 'id, webViewLink',
  })

  if (!res.data.id) {
    throw new Error('Google Drive upload did not return a file ID')
  }

  return {
    id: res.data.id,
    webViewLink: res.data.webViewLink ?? '',
  }
}

/**
 * Downloads the content of a Drive file as a Buffer.
 */
export async function downloadFileFromDrive(
  drive: ReturnType<typeof getDriveClient>,
  fileId: string
): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )

  return Buffer.from(res.data as ArrayBuffer)
}

/**
 * Uses the OAuth2 client to exchange a refresh token for a new access token.
 * Reads GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from environment variables.
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!
  )

  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await oauth2Client.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error('Failed to refresh Google access token')
  }

  return credentials.access_token
}
