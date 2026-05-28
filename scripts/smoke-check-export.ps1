$ErrorActionPreference = "Stop"

$indexPath = ".\index.html"
$appPath = ".\src\ui\app.js"

function Test-Contains {
  param(
    [string]$Path,
    [string]$Pattern
  )
  return (Select-String -Path $Path -Pattern $Pattern -Quiet)
}

$checks = @(
  @{ Name = "index_has_excel_button"; Ok = (Test-Contains $indexPath 'id="export-excel-btn"') },
  @{ Name = "index_has_pdf_button"; Ok = (Test-Contains $indexPath 'id="export-pdf-btn"') },
  @{ Name = "index_has_sheetjs"; Ok = (Test-Contains $indexPath 'xlsx\.full\.min\.js') },
  @{ Name = "index_has_exceljs"; Ok = (Test-Contains $indexPath 'exceljs@') },
  @{ Name = "index_has_html2canvas"; Ok = (Test-Contains $indexPath 'html2canvas@') },
  @{ Name = "index_has_jspdf"; Ok = (Test-Contains $indexPath 'jspdf@') },
  @{ Name = "index_has_html2pdf_fallback"; Ok = (Test-Contains $indexPath 'html2pdf\.bundle\.min\.js') },

  @{ Name = "app_has_report_data_collector"; Ok = (Test-Contains $appPath 'function getCurrentReportData\(\)') },
  @{ Name = "app_has_excel_export"; Ok = (Test-Contains $appPath 'async function exportToExcel\(\)') },
  @{ Name = "app_has_excel_fallback"; Ok = (Test-Contains $appPath 'function exportToExcelFallback\(reportData\)') },
  @{ Name = "app_has_pdf_export"; Ok = (Test-Contains $appPath 'async function exportToPdf\(\)') },
  @{ Name = "app_has_pdf_builder"; Ok = (Test-Contains $appPath 'function buildPdfReportElement\(reportData\)') },
  @{ Name = "app_has_canvas_pdf_path"; Ok = (Test-Contains $appPath 'window\.html2canvas') },
  @{ Name = "app_has_jspdf_path"; Ok = (Test-Contains $appPath 'new window\.jspdf\.jsPDF') },
  @{ Name = "app_has_html2pdf_fallback_path"; Ok = (Test-Contains $appPath '\.html2pdf\(\)') },

  @{ Name = "app_excel_has_formula_price"; Ok = (Test-Contains $appPath 'Cost-plus pricing') },
  @{ Name = "app_excel_has_formula_breakeven"; Ok = (Test-Contains $appPath 'Scenarios!B10') },
  @{ Name = "app_pdf_has_document_id"; Ok = (Test-Contains $appPath 'docNumber = `ECON-') },

  @{ Name = "app_bind_excel_button"; Ok = (Test-Contains $appPath 'exportExcelButton\.addEventListener') },
  @{ Name = "app_bind_pdf_button"; Ok = (Test-Contains $appPath 'exportPdfButton\.addEventListener') }
)

$failed = $checks | Where-Object { -not $_.Ok }
$checks | ForEach-Object { Write-Output "$($_.Name)=$($_.Ok)" }
Write-Output "failed_count=$($failed.Count)"

if ($failed.Count -gt 0) {
  Write-Output ("failed_checks=" + ($failed.Name -join ","))
  exit 1
}

Write-Output "smoke_check_export=PASS"
