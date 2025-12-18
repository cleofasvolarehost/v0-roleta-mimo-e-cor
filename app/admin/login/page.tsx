"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { adminLogin } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    console.log("[v0] Token no localStorage ao carregar login:", token)
    if (token === "authenticated") {
      router.push("/admin")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log("[v0] Tentando login com username:", username)

    try {
      const result = await adminLogin(username, password)

      if (result.success && result.token) {
        console.log("[v0] Login bem-sucedido, token recebido:", result.token)

        localStorage.setItem("admin_token", result.token)
        const verificacao = localStorage.getItem("admin_token")
        console.log("[v0] Token salvo e verificado:", verificacao)

        await new Promise((resolve) => setTimeout(resolve, 200))

        console.log("[v0] Redirecionando para /admin")
        window.location.href = "/admin"
        return
      }

      if (result.error) {
        console.log("[v0] Erro no login:", result.error)
        setError(result.error)
        setLoading(false)
      }
    } catch (err: any) {
      console.log("[v0] Erro no login:", err)
      setError(err?.message || "Erro ao fazer login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-border shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/images/mimo-20e-20cor-20logotipo-20006.png"
              alt="Mimo e Cor"
              width={100}
              height={100}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-3xl font-bold">Admin Login</CardTitle>
          <p className="text-muted">Acesso restrito a administradores</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
                required
                className="border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border-2"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-accent text-white font-bold" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
