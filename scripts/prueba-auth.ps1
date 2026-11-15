# Prueba real de A08 contra Supabase (casos de docs/prueba-auth.md).
# Uso (con el servidor encendido en otra terminal: npm start):
#   powershell -ExecutionPolicy Bypass -File scripts\prueba-auth.ps1
# Pide correos y contrasenas en la terminal; no los guarda ni los imprime.
# Imprime solo codigos y resultados, aptos para pegar en el PR.

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

# --- Variables de .env -------------------------------------------------------
$cfg = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*?)\s*$') { $cfg[$Matches[1]] = $Matches[2] }
}
foreach ($k in 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY') {
  if (-not $cfg[$k]) { throw "Falta $k en .env" }
}
$SB = $cfg['SUPABASE_URL'].TrimEnd('/')
$PUB = $cfg['SUPABASE_ANON_KEY']
$SECRET = $cfg['SUPABASE_SERVICE_ROLE_KEY']
$port = if ($cfg['PORT']) { $cfg['PORT'] } else { '3000' }
$API = "http://127.0.0.1:$port/api/v1"

function Invoke-Http([string]$Method, [string]$Uri, [hashtable]$Headers = @{}, [string]$Body = $null) {
  # User-Agent propio: el de PowerShell empieza por "Mozilla" y Supabase rechaza la clave
  # secreta en peticiones que parecen de navegador ("Forbidden use of secret API key in browser").
  $p = @{ Method = $Method; Uri = $Uri; Headers = $Headers; UseBasicParsing = $true; UserAgent = 'adaptive-rl-coach-prueba-auth' }
  if ($Body) { $p.ContentType = 'application/json'; $p.Body = [Text.Encoding]::UTF8.GetBytes($Body) }
  try {
    $r = Invoke-WebRequest @p
    return [pscustomobject]@{ Status = [int]$r.StatusCode; Body = [string]$r.Content }
  } catch {
    $resp = $_.Exception.Response
    if ($null -eq $resp) { return [pscustomobject]@{ Status = 0; Body = $_.Exception.Message } }
    # PowerShell 5.1 ya leyo el cuerpo del error; queda en ErrorDetails.
    $text = if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $_.ErrorDetails.Message } else {
      try { (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch { '' }
    }
    return [pscustomobject]@{ Status = [int]$resp.StatusCode; Body = [string]$text }
  }
}

function Get-Json($r) { try { return $r.Body | ConvertFrom-Json } catch { return $null } }
function Bearer($t) { return @{ Authorization = "Bearer $t" } }
$svc = @{ apikey = $SECRET; Authorization = "Bearer $SECRET" }   # clave privada: solo para preparar casos 11-13

# Acceso directo con clave publica: bloqueado si no hay permiso (42501) o si RLS devuelve 0 filas.
function Test-SinAcceso($r) {
  $j = Get-Json $r
  if ($r.Status -eq 200 -and $r.Body.Trim() -eq '[]') { return @('200 [] (0 filas)', $true) }
  if (($r.Status -eq 401 -or $r.Status -eq 403) -and $j.code -eq '42501') { return @("$($r.Status) permission denied", $true) }
  return @("$($r.Status) $($r.Body)", $false)
}

$health = Invoke-Http GET "http://127.0.0.1:$port/health"
if ($health.Status -ne 200) { throw "El servidor no responde en el puerto $port. Ejecuta npm start en otra terminal." }

# --- Tokens ------------------------------------------------------------------
function Get-Token([string]$label) {
  $email = Read-Host "Correo de $label"
  $sec = Read-Host "Contrasena de $label" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { $pass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  $body = @{ email = $email; password = $pass } | ConvertTo-Json -Compress
  $r = Invoke-Http POST "$SB/auth/v1/token?grant_type=password" @{ apikey = $PUB } $body
  $j = Get-Json $r
  if ($r.Status -ne 200 -or -not $j.access_token) {
    $motivo = if ($j.error_code) { $j.error_code } elseif ($j.error) { $j.error } else { 'desconocido' }
    $detalle = if ($j.msg) { $j.msg } elseif ($j.error_description) { $j.error_description } else { '' }
    throw "No se pudo iniciar sesion como $label (HTTP $($r.Status), $motivo). $detalle"
  }
  Write-Host "  Sesion de $label iniciada (inicio de sesion por correo: OK)." -ForegroundColor DarkGray
  return $j.access_token
}

$TA = Get-Token 'jugador A'
$TB = Get-Token 'jugador B'
$TADMIN = Get-Token 'administrador'

# --- Casos -------------------------------------------------------------------
$results = New-Object System.Collections.ArrayList
function Add-Result($n, $caso, $esperado, $obtenido, [bool]$ok) {
  [void]$results.Add([pscustomobject]@{ Caso = $n; Prueba = $caso; Esperado = $esperado; Obtenido = $obtenido; OK = $(if ($ok) { 'SI' } else { 'NO' }) })
}
function Get-Desc($r) { $j = Get-Json $r; if ($j.error) { "$($r.Status) $($j.error.code)" } else { "$($r.Status)" } }

$r = Invoke-Http GET "$API/me"
Add-Result 1 'Sin token' '401 AUTH_REQUIRED' (Get-Desc $r) ((Get-Desc $r) -eq '401 AUTH_REQUIRED')

$r = Invoke-Http GET "$API/me" (Bearer 'token-falso')
Add-Result 2 'Token invalido' '401 AUTH_REQUIRED' (Get-Desc $r) ((Get-Desc $r) -eq '401 AUTH_REQUIRED')

$r = Invoke-Http GET "$API/me" (Bearer $TA); $j = Get-Json $r
Add-Result 3 'Jugador A /me' '200 player active' "$($r.Status) $($j.role) $($j.status)" ($r.Status -eq 200 -and $j.role -eq 'player' -and $j.status -eq 'active')

$r = Invoke-Http GET "$API/me" (Bearer $TADMIN); $j = Get-Json $r
Add-Result 4 'Administrador /me' '200 admin active' "$($r.Status) $($j.role) $($j.status)" ($r.Status -eq 200 -and $j.role -eq 'admin')

$r = Invoke-Http GET "$API/profile" (Bearer $TA); $j = Get-Json $r
Add-Result 5 'A lee su perfil' '200 TEST_A' "$($r.Status) $($j.player_id)" ($r.Status -eq 200 -and $j.player_id -eq 'TEST_A')

$idB = (Get-Json (Invoke-Http GET "$API/me" (Bearer $TB))).id
$r = Invoke-Http GET "$API/profile?user_id=$idB&id_usuario=$idB" (Bearer $TA); $j = Get-Json $r
Add-Result 6 'A pide perfil de B por id' '200 TEST_A (id ignorado)' "$($r.Status) $($j.player_id)" ($r.Status -eq 200 -and $j.player_id -eq 'TEST_A')

$r = Invoke-Http GET "$API/profile" (Bearer $TB); $j = Get-Json $r
Add-Result 7 'B lee su perfil' '200 TEST_B' "$($r.Status) $($j.player_id)" ($r.Status -eq 200 -and $j.player_id -eq 'TEST_B')

$r = Invoke-Http GET "$API/profile" (Bearer $TADMIN)
Add-Result 8 'Usuario sin perfil' '404 RESOURCE_NOT_FOUND' (Get-Desc $r) ((Get-Desc $r) -eq '404 RESOURCE_NOT_FOUND')

$h = @{ apikey = $PUB; Authorization = "Bearer $TA" }
$t = Test-SinAcceso (Invoke-Http GET "$SB/rest/v1/perfiles?select=*" $h)
Add-Result 9 'A lee perfiles directo (clave publica)' 'sin acceso (denied o 0 filas)' $t[0] $t[1]

$t = Test-SinAcceso (Invoke-Http GET "$SB/rest/v1/usuarios?select=*" $h)
Add-Result 10 'A lee usuarios directo (clave publica)' 'sin acceso (denied o 0 filas)' $t[0] $t[1]

# 11. Registro pidiendo admin en los datos del registro -> debe quedar jugador.
$tmpEmail = "intento-admin-$([guid]::NewGuid().ToString('N').Substring(0,8))@example.com"
$tmpPass = [guid]::NewGuid().ToString('N')
$body = @{ email = $tmpEmail; password = $tmpPass; email_confirm = $true; user_metadata = @{ rol = 'administrador'; role = 'admin' } } | ConvertTo-Json -Compress
$r = Invoke-Http POST "$SB/auth/v1/admin/users" $svc $body
$tmpId = (Get-Json $r).id
if ($tmpId) {
  $u = Get-Json (Invoke-Http GET "$SB/rest/v1/usuarios?select=rol,estado&id_usuario=eq.$tmpId" $svc)
  $rol = if ($u) { $u[0].rol } else { '(sin fila)' }
  Add-Result 11 'Registro con metadata rol=administrador' 'jugador' $rol ($rol -eq 'jugador')
  [void](Invoke-Http DELETE "$SB/rest/v1/usuarios?id_usuario=eq.$tmpId" $svc)
  $del = Invoke-Http DELETE "$SB/auth/v1/admin/users/$tmpId" $svc
  if ($del.Status -ge 300) { Write-Host "  Aviso: borra a mano la cuenta temporal $tmpEmail (HTTP $($del.Status))." -ForegroundColor Yellow }
} else {
  Add-Result 11 'Registro con metadata rol=administrador' 'jugador' "no se pudo crear cuenta (HTTP $($r.Status))" $false
}

# 12-13. Suspension comprobada en servidor sin pedir token nuevo; siempre se reactiva.
$patch = @{ Prefer = 'return=minimal' } + $svc
try {
  $s = Invoke-Http PATCH "$SB/rest/v1/usuarios?id_usuario=eq.$idB" $patch '{"estado":"suspendido"}'
  if ($s.Status -ge 300) {
    Add-Result 12 'B suspendido, mismo token' '403 USER_SUSPENDED' "no se pudo suspender (HTTP $($s.Status))" $false
  } else {
    $r = Invoke-Http GET "$API/profile" (Bearer $TB)
    Add-Result 12 'B suspendido, mismo token' '403 USER_SUSPENDED' (Get-Desc $r) ((Get-Desc $r) -eq '403 USER_SUSPENDED')
  }
} finally {
  [void](Invoke-Http PATCH "$SB/rest/v1/usuarios?id_usuario=eq.$idB" $patch '{"estado":"activo"}')
}
$r = Invoke-Http GET "$API/profile" (Bearer $TB)
Add-Result 13 'B reactivado' '200' (Get-Desc $r) ($r.Status -eq 200)

# 14. Cierre de sesion de A y nuevo intento con el mismo token.
$lo = Invoke-Http POST "$SB/auth/v1/logout" @{ apikey = $PUB; Authorization = "Bearer $TA" }
$r = Invoke-Http GET "$API/me" (Bearer $TA)
Add-Result 14 'A cierra sesion y reusa token' 'logout 204; despues 401' "logout $($lo.Status); despues $(Get-Desc $r)" ($lo.Status -lt 300 -and $r.Status -eq 401)

# --- Resumen -----------------------------------------------------------------
$results | Format-Table -AutoSize -Wrap
$fail = @($results | Where-Object { $_.OK -eq 'NO' }).Count
Write-Host ("{0} de {1} casos correctos." -f ($results.Count - $fail), $results.Count) -ForegroundColor $(if ($fail) { 'Yellow' } else { 'Green' })
Write-Host "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
