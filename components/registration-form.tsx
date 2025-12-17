"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"

interface RegistrationFormProps {
  onRegister: (data: { name: string; phone: string; deviceFingerprint?: string }) => Promise<void>
}

export function RegistrationForm({ onRegister }: RegistrationFormProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("")

  useEffect(() => {
    const fingerprint = generateDeviceFingerprint()
    setDeviceFingerprint(fingerprint)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Por favor, digite seu nome.")
      return
    }

    if (!phone.trim()) {
      setError("Por favor, digite seu telefone.")
      return
    }

    // Validação básica de telefone (aceita vários formatos)
    const phoneDigits = phone.replace(/\D/g, "")
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError("Telefone inválido. Digite um número com DDD (ex: 11999887766)")
      return
    }

    setIsLoading(true)

    try {
      await onRegister({ name: name.trim(), phone: phoneDigits, deviceFingerprint })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao realizar o cadastro. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  return (
    <Card className="w-full max-w-md border-2 border-border shadow-xl">
      <CardHeader className="text-center space-y-1 py-3">
        <CardTitle className="text-xl md:text-2xl font-bold text-primary">Bem-vindo!</CardTitle>
        <CardDescription className="text-sm">Digite seus dados para participar</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-foreground font-semibold text-sm">
              Seu Nome Completo
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Digite seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-2 focus:border-primary text-base py-5"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-foreground font-semibold text-sm">
              Seu Telefone (com DDD)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99988-7766"
              value={phone}
              onChange={handlePhoneChange}
              required
              className="border-2 focus:border-primary text-base py-5"
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground leading-tight">
              Para contato em caso de vitória. Cada telefone participa 1x por campanha.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !name.trim() || !phone.trim()}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-5 text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? "Cadastrando..." : "Participar do Sorteio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
