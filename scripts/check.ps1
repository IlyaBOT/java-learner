$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$classesDir = Join-Path ([System.IO.Path]::GetTempPath()) ('java-learner-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $classesDir | Out-Null
try {
    if (-not (Get-Command javac -ErrorAction SilentlyContinue) -or -not (Get-Command java -ErrorAction SilentlyContinue)) {
        throw 'Нужен JDK 8+ с java и javac в PATH.'
    }
    $helpText = (& javac -help 2>&1 | Out-String)
    if ($helpText -match '--release') { $targetArgs = @('--release', '8') }
    else { $targetArgs = @('-source', '8', '-target', '8') }
    $files = @(Get-ChildItem (Join-Path $projectRoot 'work') -Recurse -Filter '*.java' | Sort-Object FullName)
    $sources = @((Join-Path $projectRoot 'examples/Hello.java'), (Join-Path $projectRoot 'tests/Verifier.java')) + @($files | ForEach-Object FullName)
    & javac @targetArgs -encoding UTF-8 -d $classesDir @sources
    if ($LASTEXITCODE -ne 0) { throw 'Ошибка компиляции Java.' }
    $hello = (& java -cp $classesDir Hello | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $hello -ne 'JAVA_READY') { throw 'Пример Hello сломан.' }
    Write-Host '[PASS] пример Hello'
    $pending = 0; $checked = 0
    foreach ($file in $files) {
        $chapter = $file.Directory.Name.Substring(2)
        if (Select-String -Path $file.FullName -Pattern '^\s*// TODO:' -Quiet) {
            Write-Host "[PENDING] глава ${chapter}: $($file.Name)"
            $pending++
            continue
        }
        Write-Host "[CHECK] глава $chapter"
        & java -cp $classesDir Verifier $chapter
        if ($LASTEXITCODE -ne 0) { throw "Проверка главы $chapter не прошла." }
        $checked++
    }
    Write-Host "Проверено: $checked / 12. Ожидают решения: $pending / 12."
}
finally {
    Remove-Item -Recurse -Force $classesDir -ErrorAction SilentlyContinue
}
