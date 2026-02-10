Set-Location "d:\Desktop\AutoSRS"

$allFiles = @()
$allFiles += git diff --name-only
$allFiles += git ls-files --others --exclude-standard
$allFiles = $allFiles | Where-Object { $_ -ne "" }

Write-Host "Total files to commit: $($allFiles.Count)"

$batchNum = 9  # Continue from batch 9

for ($i = 0; $i -lt $allFiles.Count; $i += 5) {
    $batchNum++
    $end = [Math]::Min($i + 4, $allFiles.Count - 1)
    $batch = $allFiles[$i..$end]
    
    # Determine area for commit message
    $areas = @()
    foreach ($f in $batch) {
        if ($f -match "^backend/beta/generated_srs/") { $a = "generated-srs" }
        elseif ($f -match "^backend/beta/static/diagrams/") { $a = "diagrams" }
        elseif ($f -match "^backend/beta/static/") { $a = "static-assets" }
        elseif ($f -match "^backend/beta/") { $a = "beta-backend" }
        elseif ($f -match "^backend/") { $a = "backend" }
        elseif ($f -match "^frontend/") { $a = "frontend" }
        else { $a = "project" }
        if ($a -notin $areas) { $areas += $a }
    }
    $areaStr = $areas -join ", "
    $msg = "feat($areaStr): update batch $batchNum - $($batch.Count) files"
    
    foreach ($f in $batch) {
        git add $f 2>$null
    }
    git commit -m $msg 2>$null
    
    Write-Host "Batch $batchNum done ($($batch.Count) files) - $areaStr"
}

Write-Host "`nAll batches committed! Total batches: $batchNum"
Write-Host "Now pushing to remote..."
git push origin main
Write-Host "Done! All changes pushed."
