export async function getClerkUserId() {
  const { auth } = await import("@clerk/tanstack-react-start/server");
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}
