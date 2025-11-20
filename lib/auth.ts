import type { User } from "./types"

export async function registerUser(
  email: string,
  password: string,
  name: string,
  company: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, company }),
    })

    const data = await response.json()

    if (data.success && data.user) {
      // Store user in sessionStorage for client-side state
      sessionStorage.setItem("current_user", JSON.stringify(data.user))
    }

    return data
  } catch (error) {
    return { success: false, error: "Network error" }
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (data.success && data.user) {
      // Store user in sessionStorage for client-side state
      sessionStorage.setItem("current_user", JSON.stringify(data.user))
    }

    return data
  } catch (error) {
    return { success: false, error: "Network error" }
  }
}

export function logoutUser() {
  sessionStorage.removeItem("current_user")
}

export function getCurrentUser(): User | null {
  const data = sessionStorage.getItem("current_user")
  if (!data) return null
  const user = JSON.parse(data)
  return { ...user, createdAt: new Date(user.createdAt) }
}

export async function updateUser(
  userId: string,
  updates: Partial<User>,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch("/api/auth/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates }),
    })

    const data = await response.json()

    if (data.success && data.user) {
      // Update sessionStorage
      sessionStorage.setItem("current_user", JSON.stringify(data.user))
    }

    return data
  } catch (error) {
    return { success: false, error: "Network error" }
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/auth/user?userId=${userId}`, {
      method: "DELETE",
    })

    const data = await response.json()

    if (data.success) {
      logoutUser()
    }

    return data
  } catch (error) {
    return { success: false, error: "Network error" }
  }
}
