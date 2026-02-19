'use client'
import { UserCircle, LogOut, LayoutDashboard } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { createClient } from '../../supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface UserData {
    email: string
    name: string
    avatarUrl: string | null
}

export default function UserProfile() {
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full w-9 h-9 overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                    {userData?.avatarUrl ? (
                        <Image
                            src={userData.avatarUrl}
                            alt={userData.name || 'User'}
                            width={36}
                            height={36}
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <UserCircle className="h-6 w-6" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-black/90 border-white/10 backdrop-blur-xl text-gray-300 p-2">
                {userData && (
                    <>
                        <div className="px-3 py-2">
                            <p className="text-sm font-medium text-white truncate">{userData.name}</p>
                            <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                        </div>
                        <DropdownMenuSeparator className="bg-white/10" />
                    </>
                )}
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer py-2 px-3 rounded-md">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                    className="focus:bg-white/10 focus:text-white cursor-pointer py-2 px-3 rounded-md"
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
    )
}