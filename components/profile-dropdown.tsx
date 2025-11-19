"use client"

import { useState } from "react"
import { User, LogOut, Settings, UserCircle, Building2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { logoutUser, updateUser, deleteUser } from "@/lib/auth-server"
import { useRouter } from 'next/navigation'
import { User as UserType } from "@/lib/types"

interface ProfileDropdownProps {
  user: UserType
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const router = useRouter()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    company: user.company
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleLogout = () => {
    logoutUser()
    router.push("/login")
  }

  const handleUpdateProfile = () => {
    setError("")
    setSuccess("")

    if (!formData.name || !formData.email || !formData.company) {
      setError("Please fill in all fields")
      return
    }

    const result = updateUser(user.id, formData)

    if (result.success) {
      setSuccess("Profile updated successfully")
      setTimeout(() => {
        setShowProfileDialog(false)
        window.location.reload()
      }, 1500)
    } else {
      setError(result.error || "Update failed")
    }
  }

  const handleDeleteAccount = () => {
    const result = deleteUser(user.id)
    if (result.success) {
      router.push("/login")
    } else {
      setError(result.error || "Deletion failed")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-neutral-400 hover:text-orange-500"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline text-sm">{user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800">
          <DropdownMenuLabel className="text-neutral-400">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-neutral-800" />
          <DropdownMenuItem
            onClick={() => setShowProfileDialog(true)}
            className="text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-neutral-800 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Settings Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Update your account information
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="bg-red-950 border-red-900">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-950 border-green-900">
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-neutral-300">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-neutral-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>

            <div>
              <Label htmlFor="company" className="text-neutral-300">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateProfile}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Update Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="border-red-900 text-red-400 hover:bg-red-950"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 border-neutral-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
