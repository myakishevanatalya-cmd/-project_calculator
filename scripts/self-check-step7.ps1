$indexPath = ".\index.html"
$appPath = ".\src\ui\app.js"

function Test-Contains($path, $pattern) {
  return (Select-String -Path $path -Pattern $pattern -Quiet)
}

$checks = @(
  @{ Name = "index_has_excel_button"; Ok = (Test-Contains $indexPath 'id="export-excel-btn"') },
  @{ Name = "index_has_pdf_button"; Ok = (Test-Contains $indexPath 'id="export-pdf-btn"') },
  @{ Name = "index_has_xlsx_lib"; Ok = (Test-Contains $indexPath 'xlsx.full.min.js') },
  @{ Name = "index_has_html2pdf_lib"; Ok = (Test-Contains $indexPath 'html2pdf.bundle.min.js') },
  @{ Name = "app_has_report_data_collector"; Ok = (Test-Contains $appPath 'function getCurrentReportData\(\)') },
  @{ Name = "app_has_excel_export"; Ok = (Test-Contains $appPath 'function exportToExcel\(\)') },
  @{ Name = "app_has_pdf_export"; Ok = (Test-Contains $appPath 'function exportToPdf\(\)') },
  @{ Name = "app_has_break_even_export"; Ok = (Test-Contains $appPath 'breakEvenRows') },
  @{ Name = "app_has_scenarios_export"; Ok = (Test-Contains $appPath 'scenarioRows') },
  @{ Name = "app_has_cost_export"; Ok = (Test-Contains $appPath 'costRows') },
  @{ Name = "app_bind_excel_button"; Ok = (Test-Contains $appPath 'exportExcelButton\.addEventListener') },
  @{ Name = "app_bind_pdf_button"; Ok = (Test-Contains $appPath 'exportPdfButton\.addEventListener') }
)

$failed = $checks | Where-Object { -not $_.Ok }
$checks | ForEach-Object { Write-Output "$($_.Name)=$($_.Ok)" }
Write-Output "failed_count=$($failed.Count)"

if ($failed.Count -gt 0) {
  exit 1
}
