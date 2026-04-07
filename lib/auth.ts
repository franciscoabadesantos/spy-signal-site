export async function getViewerUserId(): Promise<string | null> {
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const state = await auth()
    return state.userId ?? null
  } catch {
    return null
  }
}

export async function isViewerSignedIn(): Promise<boolean> {
  const userId = await getViewerUserId()
  return Boolean(userId)
}
