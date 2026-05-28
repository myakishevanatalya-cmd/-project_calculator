$items = @(
  [pscustomobject]@{ id = "calc-001"; status = "утвержден"; margin = 18.5; event_date = "2026-06-12"; created_at = "2026-05-03T10:15:00+03:00" },
  [pscustomobject]@{ id = "calc-002"; status = "черновик"; margin = 9.2; event_date = "2026-07-20"; created_at = "2026-05-18T14:50:00+03:00" },
  [pscustomobject]@{ id = "calc-003"; status = "утвержден"; margin = 27.4; event_date = "2026-06-05"; created_at = "2026-04-27T09:00:00+03:00" },
  [pscustomobject]@{ id = "calc-004"; status = "черновик"; margin = -3.1; event_date = "2026-08-14"; created_at = "2026-05-24T11:20:00+03:00" },
  [pscustomobject]@{ id = "calc-005"; status = "утвержден"; margin = 14.8; event_date = "2026-12-25"; created_at = "2026-05-10T16:40:00+03:00" }
)

$approved = $items | Where-Object { $_.status -eq "утвержден" }
$approvedOnly = ($approved | Where-Object { $_.status -ne "утвержден" }).Count -eq 0
Write-Output "filter_status_approved_count=$($approved.Count)"
Write-Output "filter_status_approved_only=$approvedOnly"

$sortedMarginAsc = $items | Sort-Object -Property margin
$sortedMarginDesc = $items | Sort-Object -Property margin -Descending

$ascFirst = $sortedMarginAsc[0].margin
$ascLast = $sortedMarginAsc[-1].margin
$descFirst = $sortedMarginDesc[0].margin
$descLast = $sortedMarginDesc[-1].margin

$orderChanged = ($ascFirst -ne $descFirst) -and ($ascLast -ne $descLast)
Write-Output "sort_margin_asc_first=$ascFirst"
Write-Output "sort_margin_asc_last=$ascLast"
Write-Output "sort_margin_desc_first=$descFirst"
Write-Output "sort_margin_desc_last=$descLast"
Write-Output "sort_margin_order_changed=$orderChanged"
