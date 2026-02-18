import Link from 'next/link'
import { createClient } from '../../supabase/server'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { ChevronDown, Menu } from "lucide-react"
import UserProfile from './user-profile'

export default async function Navbar() {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 px-4">
      <div className="w-full max-w-5xl bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-8 py-3 flex justify-between items-center shadow-lg shadow-black/20">
        <Link href="/" className="text-xl font-bold text-white tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
             <span className="text-black font-bold text-lg">N</span>
          </div>
          NumSphere
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white transition-colors outline-none focus:outline-none">
                    Services <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 border-white/10 backdrop-blur-xl text-gray-300 min-w-[200px] p-2">
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2 px-3 rounded-md">
                        Missed Call Recovery
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2 px-3 rounded-md">
                        Automated Booking
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2 px-3 rounded-md">
                        Customer Database
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Link href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Pricing
            </Link>
            <Link href="#about" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                About
            </Link>
        </div>

        <div className="flex gap-4 items-center">
          {user ? (
            <UserProfile />
          ) : (
            <Link
              href="/sign-in"
              className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
            >
              Log in
            </Link>
          )}
          <Link
            href={user ? "/dashboard" : "/sign-up"}
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            {user ? "Dashboard" : "Book Consultation"}
          </Link>
        </div>
      </div>
    </nav>
  )
}
