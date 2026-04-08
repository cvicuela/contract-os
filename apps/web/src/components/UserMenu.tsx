"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useI18n } from '@/i18n/context'

function getInitials(name?: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("")
}

function useDemoMode() {
  const [isDemo, setIsDemo] = useState(false)
  useEffect(() => {
    setIsDemo(document.cookie.includes('demo_mode=1'))
  }, [])
  return isDemo
}

export default function UserMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDemo = useDemoMode()
  const { t } = useI18n()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Demo mode banner
  if (isDemo && !session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
          {t.userMenu.demoMode}
        </span>
        <Link
          href="/login"
          className="text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          {t.userMenu.signUpFree}
        </Link>
      </div>
    )
  }

  if (!session?.user) return null

  const { name, email, image } = session.user

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
        aria-label={t.userMenu.openMenu}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {image ? (
          <Image
            src={image}
            alt={name ?? "User avatar"}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-950 text-white text-sm font-semibold flex items-center justify-center shadow ring-2 ring-white select-none">
            {getInitials(name)}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg shadow-black/10 border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
          {/* User info */}
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {name ?? t.userMenu.unknownUser}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {email ?? ""}
            </p>
          </div>

          {/* Plan badge */}
          <div className="px-4 pb-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {t.userMenu.freeTrial}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Actions */}
          <div className="p-1">
            <Link
              href="/login#pricing"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-100"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {t.userMenu.upgradePlan}
            </Link>
            <button
              onClick={() => {
                setOpen(false)
                signOut({ callbackUrl: "/login" })
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors duration-100 text-left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-gray-400 shrink-0"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {t.userMenu.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

