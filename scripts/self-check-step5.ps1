$fixed = 100000
$variablePerParticipant = 500
$taxPercent = 5
$feePercent = 2
$participantsMin = 50
$participantsPlan = 100
$participantsMax = 150
$targetMarginPercent = 20

function Get-TicketPrice([double]$fixedCost, [double]$variableCost, [double]$marginPercent, [double]$tax, [double]$fee, [int]$planParticipants) {
  $netFactor = 1 - (($tax + $fee) / 100)
  $marginFactor = 1 - ($marginPercent / 100)
  if ($planParticipants -le 0 -or $netFactor -le 0 -or $marginFactor -le 0) {
    return $null
  }
  $totalCosts = $fixedCost + ($variableCost * $planParticipants)
  return $totalCosts / ($planParticipants * $netFactor * $marginFactor)
}

function Get-Scenario([int]$participants, [double]$ticketPrice, [double]$fixedCost, [double]$variableCost) {
  $revenue = $ticketPrice * $participants
  $variableTotal = $variableCost * $participants
  $totalCosts = $fixedCost + $variableTotal
  $profit = $revenue - $totalCosts
  $margin = if ($revenue -eq 0) { 0 } else { ($profit / $revenue) * 100 }
  $status = if ($margin -lt 0) { "Убыток" } elseif ([math]::Abs($margin) -le 1) { "Окупаемость" } else { "Прибыль" }
  [pscustomobject]@{
    Participants = $participants
    TicketPrice = [math]::Round($ticketPrice, 2)
    Revenue = [math]::Round($revenue, 2)
    VariableCosts = [math]::Round($variableTotal, 2)
    FixedCosts = [math]::Round($fixedCost, 2)
    TotalCosts = [math]::Round($totalCosts, 2)
    Profit = [math]::Round($profit, 2)
    MarginPercent = [math]::Round($margin, 2)
    Status = $status
  }
}

function Get-BreakEven([double]$fixedCost, [double]$variableCost, [double]$ticketPrice, [double]$tax, [double]$fee) {
  $netTicketPrice = $ticketPrice * (1 - (($tax + $fee) / 100))
  $denominator = $netTicketPrice - $variableCost
  if ($denominator -le 0) {
    return [pscustomobject]@{
      Ok = $false
      Value = $null
      Message = "Конструкция убыточна при любом количестве участников."
    }
  }
  return [pscustomobject]@{
    Ok = $true
    Value = [math]::Round(($fixedCost / $denominator), 2)
    Message = ""
  }
}

$price = Get-TicketPrice $fixed $variablePerParticipant $targetMarginPercent $taxPercent $feePercent $participantsPlan
$minScenario = Get-Scenario $participantsMin $price $fixed $variablePerParticipant
$planScenario = Get-Scenario $participantsPlan $price $fixed $variablePerParticipant
$maxScenario = Get-Scenario $participantsMax $price $fixed $variablePerParticipant
$breakEven = Get-BreakEven $fixed $variablePerParticipant $price $taxPercent $feePercent

$speed = (Measure-Command {
  1..1000 | ForEach-Object {
    $testMargin = 20 + ($_ % 5)
    $p = Get-TicketPrice $fixed $variablePerParticipant $testMargin $taxPercent $feePercent $participantsPlan
    [void](Get-Scenario $participantsPlan $p $fixed $variablePerParticipant)
  }
}).TotalMilliseconds

Write-Output "TicketPrice=$([math]::Round($price, 2))"
Write-Output "Scenario.Minimum:"
$minScenario | Format-List
Write-Output "Scenario.Plan:"
$planScenario | Format-List
Write-Output "Scenario.Maximum:"
$maxScenario | Format-List
if ($breakEven.Ok) {
  Write-Output "BreakEvenParticipants=$($breakEven.Value)"
} else {
  Write-Output "BreakEvenWarning=$($breakEven.Message)"
}
Write-Output "Recalc1000IterationsMs=$([math]::Round($speed, 2))"

$negativeMarginPrice = Get-TicketPrice $fixed $variablePerParticipant -10 $taxPercent $feePercent $participantsPlan
$negativeMarginScenario = Get-Scenario $participantsPlan $negativeMarginPrice $fixed $variablePerParticipant
Write-Output "NegativeMarginScenarioStatus=$($negativeMarginScenario.Status)"

$lowPrice = 500
$warningBreakEven = Get-BreakEven $fixed $variablePerParticipant $lowPrice $taxPercent $feePercent
if (-not $warningBreakEven.Ok) {
  Write-Output "BreakEvenWarningCase=OK"
}
