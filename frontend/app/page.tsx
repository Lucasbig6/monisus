"use client"

import { redirect } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

export default function RootPage() {
  redirect(isAuthenticated() ? "/inicio" : "/login")
}
