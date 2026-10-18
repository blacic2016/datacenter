# Acceso a GitHub – Daedalous

| Dato | Valor |
|---|---|
| Repositorio | https://github.com/blacic2016/datacenter |
| Remote HTTPS | `https://github.com/blacic2016/datacenter.git` |
| Remote SSH | `git@github.com:blacic2016/datacenter.git` |
| Usuario | `blacic2016` |
| Correo | `blacic2016@gmail.com` |
| Rama principal | `main` |
| Autenticación | Personal Access Token (PAT) guardado en **Administrador de credenciales de Windows** (no en archivos del repo) |

> ⚠️ **Nunca** escribir el token en archivos del proyecto: GitHub lo detecta y lo revoca automáticamente, y quedaría expuesto en el historial.

## Configuración en una máquina nueva
```powershell
git clone https://github.com/blacic2016/datacenter.git
cd datacenter
git config user.name  "blacic2016"
git config user.email "blacic2016@gmail.com"
git config credential.helper manager
# Al primer push, Git pide credenciales: usuario = blacic2016, contraseña = el token (PAT)
```

## Flujo de trabajo
```powershell
git pull
git add .
git commit -m "feat(step-04): cálculo de carga IT"
git push
```

## Rotar / revocar el token
GitHub → **Settings → Developer settings → Personal access tokens** → revocar el token anterior → generar uno nuevo (scope `repo`) → en Windows: *Administrador de credenciales → Credenciales de Windows → git:https://github.com* → editar contraseña.
