# 이미지 파일 크기 확인
$path = 'C:\Users\smuse73\developer\monk_project\MONK_kr\monk_studio\id_photo\images'

Get-ChildItem "$path\*.jpg" | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 1)
    Write-Host "$($_.Name): $sizeKB KB"
}
