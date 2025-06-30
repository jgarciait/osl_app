"use client"

import { useState } from "react"
import { createClientClient } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from "lucide-react"

export function ProfileForm({ profile, user }) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientClient()

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  // Profile form data
  const [profileData, setProfileData] = useState({
    nombre: profile?.nombre || "",
    apellido: profile?.apellido || "",
    telefono: profile?.telefono || "",
  })

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingProfile(true)

    try {
      // Verificar si el perfil ya existe
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      let result

      if (existingProfile) {
        // Si el perfil existe, usar update
        result = await supabase
          .from("profiles")
          .update({
            nombre: profileData.nombre,
            apellido: profileData.apellido,
            telefono: profileData.telefono,
            email: user.email,
            updated_at: new Date(),
          })
          .eq("id", user.id)
      } else {
        // Si el perfil no existe, usar insert
        result = await supabase.from("profiles").insert({
          id: user.id,
          nombre: profileData.nombre,
          apellido: profileData.apellido,
          telefono: profileData.telefono,
          email: user.email,
          updated_at: new Date(),
        })
      }

      if (result.error) throw result.error

      toast({
        title: "Perfil actualizado",
        description: "Su información de perfil ha sido actualizada exitosamente",
      })

      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "Ocurrió un error al actualizar su perfil",
      })
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingPassword(true)

    try {
      // Validar que las contraseñas coincidan
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Las contraseñas nuevas no coinciden",
        })
        return
      }

      // Validar longitud mínima
      if (passwordData.newPassword.length < 8) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La contraseña debe tener al menos 8 caracteres",
        })
        return
      }

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      })

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La contraseña actual es incorrecta",
        })
        return
      }

      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) throw updateError

      toast({
        title: "¡Contraseña actualizada exitosamente!",
        description: "Su contraseña ha sido cambiada correctamente. La nueva contraseña ya está activa.",
        variant: "default",
      })

      // Limpiar formulario
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        variant: "destructive",
        title: "Error al actualizar contraseña",
        description: error.message || "Ocurrió un error al actualizar su contraseña. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <div>
              <CardTitle className="text-lg font-semibold">Información de Perfil</CardTitle>
              <p className="text-sm text-muted-foreground">Actualice su información personal</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Input id="email" value={user.email} disabled className="pr-10" />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={profileData.nombre}
                onChange={handleProfileInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                name="apellido"
                value={profileData.apellido}
                onChange={handleProfileInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={profileData.telefono} onChange={handleProfileInputChange} />
            </div>

            <Button type="submit" disabled={isSubmittingProfile} className="w-full bg-blue-500 hover:bg-blue-600">
              {isSubmittingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-green-500 rounded-full"></div>
            <div>
              <CardTitle className="text-lg font-semibold">Cambiar Contraseña</CardTitle>
              <p className="text-sm text-muted-foreground">Actualice su contraseña de acceso</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-full">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Ingrese su contraseña actual"
                  required
                  className="pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 8 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Confirme su nueva contraseña"
                  required
                  className="pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isSubmittingPassword} className="w-full bg-green-500 hover:bg-green-600">
              {isSubmittingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
