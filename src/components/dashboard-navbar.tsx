'use client'

import Link from 'next/link'
import { createClient } from '../../supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { UserCircle, Home, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface UserData {
  email: string
  name: string
  avatarUrl: string | null
}

export default function DashboardNavbar() {
  const supabase = createClient()
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData({
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
          avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        })
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserData({
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
          avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
        })
      } else {
        setUserData(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            NumSphere
          </Link>
        </div>
        <div className="flex gap-4 items-center">
          {userData && (
            <span className="text-sm text-gray-500 hidden sm:inline">
              {userData.name}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full w-9 h-9 overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors">
                {userData?.avatarUrl ? (
                  <Image
                    src={userData.avatarUrl}
                    alt={userData?.name || 'User'}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-6 w-6" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {userData && (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{userData.name}</p>
                    <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push("/")
                  router.refresh()
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
